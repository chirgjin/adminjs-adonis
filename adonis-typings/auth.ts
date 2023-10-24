declare module '@ioc:Adonis/Addons/AdminJS' {
    export type AuthOptions = {
        /**
         * Authentication enabled/disabled flag.
         * When set to true, the authentication is enabled. When set to false, it's disabled.
         */
        enabled: boolean

        /**
         * Maximum number of login retries allowed.
         * The user is locked out after exceeding this limit.
         */
        maxRetries: number

        /**
         * Duration (in seconds) for which a user is locked out after exceeding the max retries.
         */
        duration: number

        /**
         * Optional login path for authentication.
         * If not provided, a default path is used.
         */
        loginPath?: string

        /**
         * Optional logout path for authentication.
         * If not provided, a default path is used.
         */
        logoutPath?: string

        /**
         * Function for authenticating a user.
         * This function takes an email and password as parameters and returns
         * a user object if authentication is successful or null if it fails.
         *
         * @param email - The user's email address for authentication.
         * @param password - The user's password for authentication.
         * @returns A user object if authentication is successful, or null if it fails.
         */
        authenticate: (email: string, password: string) => unknown | null
    }
}
