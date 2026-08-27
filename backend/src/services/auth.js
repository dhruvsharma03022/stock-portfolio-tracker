import { getCurrentUser } from "aws-amplify/auth";

export const getLoggedInUser = async () => {
    try {
        const user = await getCurrentUser();
        return user;
    } catch (error) {
        return null;
    }
};