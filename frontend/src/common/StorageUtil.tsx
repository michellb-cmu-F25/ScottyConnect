import { TOKEN_KEY, USER_KEY, EMAIL_KEY } from "./StorageKeys";

export default class StorageUtil {

    // User operations
    static setUser(username: string, email: string) {
        localStorage.setItem(USER_KEY, username)
        localStorage.setItem(EMAIL_KEY, email)
    }
    static getUser() {
        return {
            username: localStorage.getItem(USER_KEY),
            email: localStorage.getItem(EMAIL_KEY)
        }
    }
    static removeUser() {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(EMAIL_KEY)
    }

    // Token operations
    static setToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token)
    }
    static getToken() {
        return localStorage.getItem(TOKEN_KEY)
    }
    static removeToken() {
        localStorage.removeItem(TOKEN_KEY)
    }

}