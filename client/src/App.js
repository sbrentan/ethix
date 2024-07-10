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

function App() {
	return (
		<>
			<Routes>
				<Route path="/" element={<MainLayout />}>
                    {/* public routes */}
                    <Route index element={
                        <div className="App">
                        <header className="App-header">
                            <img src={logo} className="App-logo" alt="logo" />
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
                    <Route path="logout" element={<Logout />}/>

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
                            </Route>
                        </Route>

                    </Route>

                    {/* 404 Page not Found */}
					<Route path="*" element={<NotFoundResult />} />

                </Route>
			</Routes>
		</>
	);
}

export default App;
