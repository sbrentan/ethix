import { Routes, Route } from "react-router-dom";

import MainLayout from "./components/MainLayout";
import logo from "./logo.svg";
import NotFoundResult from "./components/NotFoundResult";
import Login from "./features/auth/Login";
import PersistLogin from "./features/auth/PersistLogin";
import RequireAuth from "./features/auth/RequireAuth";
import { ROLES } from "./config/roles";
import Logout from "./components/Logout";
import UsersList from "./features/users/UsersList";
import EditUser from "./features/users/EditUser";
import NewUserForm from "./features/users/NewUserForm";
import Register from "./features/auth/Register";
import ProfileRequestsList from "./features/requests/ProfileRequestsList";
import MyProfileRequest from "./features/requests/MyProfileRequest";
import MyCampaigns from "./features/campaigns/MyCampaigns";
import NewCampaign from "./features/campaigns/NewCampaign.js";
import CampaignsList from "./features/campaigns/CampaignsList";
import CampaignsGrid from "./features/campaigns/CampaignsGrid";
import Campaign from "./features/campaigns/Campaign";
import HomePage from "./components/HomePage";
import RedeemOverview from "./features/campaigns/RedeemOverview";
import RedeemPage from "./features/campaigns/RedeemPage";

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    {/* public routes */}
                    <Route index element={
                        <div className="App">
                            <header className="App-header">
                                <img src={logo} className="App-logo" alt="logo" width={100} />
                                <p>
                                    Edit <code>src/App.js</code> and save to reload.
                                </p>
                                <a
                                    className="App-link"
                                    href="https://reactjs.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Learn React
                                </a>
                            </header>
                        </div>
                    } />
                    <Route path="login" element={<Login />} />
                    <Route path="logout" element={<Logout />} />
                    <Route path="register" element={<Register />} />
                    <Route path="home" element={<HomePage />} />

                    <Route path="redeem">
                        <Route index element={<RedeemOverview />} />
                        <Route path=":token" element={<RedeemPage />} />
                    </Route>

                    {/* Protected Routes */}
                    <Route element={<PersistLogin />}>

                        <Route path="campaigns">
                            <Route index element={<CampaignsGrid />} />
                            <Route path=":id">
                                <Route index element={<Campaign />} />
                            </Route>
                        </Route>

                        {/* Protected Routes */}
                        <Route element={<PersistLogin />}>



                            {/* User Routes */}
                            <Route
                                element={
                                    <RequireAuth allowedRoles={[ROLES.User]} />
                                }
                            >
                                <Route path="user">
                                    <Route index element={<>User</>} />
                                    <Route path="campaigns">
                                        <Route index element={<CampaignsGrid />} />
                                    </Route>
                                </Route>
                            </Route>

                            {/* Donor Routes */}
                            <Route
                                element={
                                    <RequireAuth allowedRoles={[ROLES.Donor]} />
                                }
                            >
                                <Route path="donor">
                                    <Route index element={<>Donor</>} />
                                    <Route
                                        path="dashboard"
                                        element={<p>dashboard</p>}
                                    />
                                    <Route
                                        path="profile"
                                        element={<MyProfileRequest />}
                                    />
                                    <Route
                                        path="donorCampaigns"
                                        element={<MyCampaigns />}
                                    />
                                    <Route
                                        path="newCampaign"
                                        element={<NewCampaign />}
                                    />
                                </Route>
                            </Route>

                            {/* Beneficiary Routes */}
                            <Route
                                element={
                                    <RequireAuth allowedRoles={[ROLES.Beneficiary]} />
                                }
                            >
                                <Route path="beneficiary">
                                    <Route index element={<>Beneficiary</>} />
                                    <Route
                                        path="dashboard"
                                        element={<p>dashboard</p>}
                                    />
                                    <Route
                                        path="beneficiaryCampaigns"
                                        element={<MyCampaigns />}
                                    />
                                    <Route
                                        path="profile"
                                        element={<MyProfileRequest />}
                                    />
                                </Route>
                            </Route>

                            {/* Admin Routes */}
                            <Route
                                element={
                                    <RequireAuth allowedRoles={[ROLES.Admin]} />
                                }
                            >
                                <Route path="admin">
                                    <Route index element={<>Admin</>} />
                                    <Route path="users">
                                        <Route index element={<UsersList />} />
                                    /* <Route
                                            path=":id"
                                            element={<EditUser />}
                                        />
                                        <Route
                                            path="new"
                                            element={<NewUserForm />}
                                        />
                                    </Route>
                                    <Route path="campaigns">
                                        <Route index element={<CampaignsList />} />
                                    </Route>
                                    <Route path="requests">
                                        <Route index element={<ProfileRequestsList />} />
                                    </Route>
                                </Route>
                            </Route>

                        </Route>

                        {/* 404 Page not Found */}
                        <Route path="*" element={<NotFoundResult />} />

                        </Route>
                    </Route>
            </Routes>
        </>
    );
}

export default App;
