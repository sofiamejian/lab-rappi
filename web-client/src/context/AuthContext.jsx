export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loading, setLoading] = useState(false);

    function loginUser(data) {
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);
    }

    function logoutUser() {
        localStorage.removeItem("user");
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
