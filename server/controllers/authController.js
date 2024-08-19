const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const ROLES_LIST = require('../config/roles_list')
const ProfileRequest = require('../models/ProfileRequest')
const PublicProfile = require('../models/PublicProfile')
require('dotenv').config();

// @desc Register the unauthenticated user as new "User"
// @route POST /auth/register
// @access Public
const register = asyncHandler(async (req, res) => {
    const { username, wallet, password } = req.body
    const address = wallet.address;

    // Confirm data
    if (!username || !password||!address) {
        return res.status(400).json({ message: 'All fields are required'})
    }

    // Check for duplicate
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username'})
    }

    // Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    // Role is ALWAYS User when registring
    const role = ROLES_LIST.user
    
    // User should be verified, while beneficiary and donors should have it as default false. waiting for an admin approval
    const verified = true

    const user = await User.create({ username, address, "password": hashedPwd, role, verified })

    if (!user) {
        return res.status(500).json({ message: 'Something went wrong' })
    }

    res.status(200).json({ message: `Account created!` });
})

// @desc Register the unauthenticated user as new "User"
// @route POST /auth/register/thirdParts
// @access Public
const registerDonorBeneficiary = asyncHandler(async (req, res) => {
    const { username, wallet, password, role } = req.body
    const values = {...req.body}
    const address = wallet.address;

    // Confirm data
    if (!username || !password ||!address) {
        return res.status(400).json({ message: 'All fields are required'})
    }

    // Check for duplicate
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username'})
    }

    // Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    // Role is ALWAYS User when registring
    if (!Object.values(ROLES_LIST).includes(role) || role === ROLES_LIST.admin || role === ROLES_LIST.user)
        // check role valid
        return res.status(409).json({ message: "Invalid role" });
    
    // User should be verified, while beneficiary and donors should have it as default false. waiting for an admin approval
    const verified = false

    const user = await User.create({ username, address, "password": hashedPwd, role, verified })

    if (!user) {
        return res.status(500).json({ message: 'Something went wrong' })
    } else {
        // create the new profile request for the admin

        // do I fill the donorSchema or beneficiarySchema?
        const donorData = role === ROLES_LIST.donor ? {...values, user: user._id.toString()} : undefined
        const beneficiaryData = role === ROLES_LIST.beneficiary ? {...values, user: user._id.toString()} : undefined

        const request = await ProfileRequest.create({ user: user._id.toString(), username, address, role, donorData, beneficiaryData})

        // to create the public data
        const publicName = role === ROLES_LIST.donor ? values?.companyName : values?.beneficiaryName
        const publicProfile = await PublicProfile.create({ user: user._id.toString(), publicName})
    }

    res.status(200).json({ message: `Account created!` });
})


// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
    const { username, password, address } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }
    

    const foundUser = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).exec()

    // User exists and it is active
    if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized' })
    }


    const match = await bcrypt.compare(password, foundUser.password)

    if (!match) return res.status(401).json({ message: 'Unauthorized' })

    const userrequest = await ProfileRequest.findOne({ username: username })
    let matchaddress = false;
    matchaddress = foundUser.role === ROLES_LIST.admin ? matchaddress = process.env.WEB3_MANAGER_ADDRESS.toLowerCase() === address.toLowerCase() : matchaddress = userrequest?.address.toLowerCase() === address.toLowerCase() 
    
        if (!matchaddress) return res.status(401).json({ message: 'Metamask address not matching' })
    
    // Here we can block the not verified account to login - in our case we can still allow them to enter the 
    // private area of the website and instead block the request for creating campaings etc..
    // if (!foundUser.verified) {
    //     return res.status(422).json({ message: 'Account is not verified' })
    // }

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "userId": foundUser._id,
                "username": foundUser.username,
                "role": foundUser.role,
                "verified": foundUser.verified,
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '20m' }
    )

    const refreshToken = jwt.sign(
        { "username": foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' } // This should be 1d
    )

    // Create secure cookie with refresh token 
    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server 
        secure: true, //https
        sameSite: 'None', //cross-site cookie 
        maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT, if is same duration the case where the refresh never appear because browser dont send expired cookies
    })

    // Send accessToken containing username and role 
    res.json({ accessToken })
})

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => { // the err can come from the verify process
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const foundUser = await User.findOne({ username: decoded.username }).exec()

            if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "userId": foundUser._id,
                        "username": foundUser.username,
                        "role": foundUser.role,
                        "verified": foundUser.verified,
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '20m' }
            )

            res.json({ accessToken })
        })
    )
}

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
}

module.exports = {
    login,
    refresh,
    logout,
    register,
    registerDonorBeneficiary
}