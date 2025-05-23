import { db } from "./db";
import { getSelf } from "./auth-service";
import { get } from "http";


export const isFollowingUser = async (id : string) => {
    try {
        const self = await getSelf();
        const otherUser = await db.user.findUnique({
            where: {    
                id: id,
            },
        });
            if (!otherUser) {
                throw new Error("User not found");
            }

            if (otherUser.id === self.id) {
                return true;
            }

            const existingFollow = await db.follow.findFirst({
                where: {
                    followerId: self.id,
                    followingId: otherUser.id,
                },
            });

            return !!existingFollow; // true if not following, false if following
       
    } catch (error) {
        return false;
    }

} 

export const followUser = async (id: string) => {

    const self = await getSelf();
    const otherUser = await db.user.findUnique({
        where: {    
            id
        },
    });

    if (!otherUser) {
        throw new Error("User not found");
    }

    if (otherUser.id === self.id) {
        throw new Error("Cannot follow yourself");
    }

    const existingFollow = await db.follow.findFirst({
        where: {
            followerId: self.id,
            followingId: otherUser.id,
        },
    });

    if (existingFollow) {
        throw new Error("Already following this user");
    }

    const follow = await db.follow.create({
        data: {
            followerId: self.id,
            followingId: otherUser.id,
        },
        include: {
            follower: true,
            following: true,
        },
    });

    return follow;

}

export const unfollowUser = async(id: string) => {
    const self = await getSelf();
    const otherUser = await db.user.findUnique({
        where: {
            id,
        },
    });

    if (!otherUser)
    {
        throw new Error("User not found");
    }

    if (otherUser.id === self.id)
    {
        throw new Error("You cannot unfollow yourself")
    }

    const existingFollow = await db.follow.findFirst({
        where:{
            followerId: self.id,
            followingId: otherUser.id
        }
        
    })

    if (!existingFollow)
    {
        throw new Error("Not following")
    }

    const follow = await db.follow.delete({
        where: {
            id: existingFollow.id
        },
        include: {
            following: true
        }
    });

    return follow;
}

export const getUserFollowedUsers = async () => {
    try {
        const self = await getSelf();
        const followedUser = db.follow.findMany({
            where: {
                followerId: self.id,
                following: {
                    blocking: {
                        none: {
                            blockedId: self.id,
                        }
                    }
                }
            },
            include: {
                following : {
                    include: {
                        stream: {
                            select: {
                                isLive: true,
                            },
                        },
                    },
                },
            },
        });
        
        return followedUser;
    } catch (error) {
        return [];
    }
}