import { createContext, useContext, useState } from "react"
 
export const AuthContext = createContext()
 
export const useAuth = () => useContext(AuthContext)
 
export const AuthProvider = ({ children }) => {
 
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user"))
    )
 
    function loginUser(data) {
        localStorage.setItem("user", JSON.stringify(data))
        setUser(data)
    }
 
    function logoutUser() {
        localStorage.removeItem("user")
        setUser(null)
    }
 
    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    )
}
 