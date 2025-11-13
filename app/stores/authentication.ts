import { defineStore } from 'pinia';

export interface InterfaceShow {
    token: string,
    user: object,
    userId: string | null,
    info: object,
    profile: object,
    profileId: string,
    group: object,
    codePurchase: string | null,
    friends: object[],
    countWarnings: number,
    countFriendRequests: number,
}

export const useAuthentication = defineStore('authentication', {
    state: (): InterfaceShow => ({
        token: '',
        user: {},
        userId: '',
        info: {},
        profile: {},
        profileId: '',
        group: {},
        codePurchase: '',
        friends: [],
        countWarnings: 0,
        countFriendRequests: 0,
    }),
    actions: {
        setToken(dataToken: string) {
            this.token = dataToken
        },
        setUser(dataUser: object) {
            this.user = dataUser
        },
        setUserId(dataUserId: any) {
            this.userId = dataUserId
        },
        setInfo(dataInfo: object) {
            this.info = dataInfo
        },
        setProfile(dataProfile: object) {
            this.profile = dataProfile
        },
        setProfileId(dataProfileId: string) {
            this.profileId = dataProfileId
        },
        setGroup(dataGroup: object) {
            this.group = dataGroup
        },
        setCodePurchase(dataCodePurchase: any) {
            this.codePurchase = dataCodePurchase
        },
        setFriends(dataFriends: object[]) {
            this.friends = dataFriends
        },
        setCountWarnings(dataCountWarnings: number) {
            this.countWarnings = dataCountWarnings
        },
        setCountFriendRequests(dataCountFriendRequests: number) {
            this.countFriendRequests = dataCountFriendRequests
        }
    },
    getters: {
        getToken(): string {
            return this.token
        },
        getUser(): object {
            return this.user
        },
        getUserId(): any {
            return this.userId
        },
        getInfo(): object {
            return this.info
        },
        getProfile(): object {
            return this.profile
        },
        getProfileId(): string {
            return this.profileId
        },
        getGroup(): object {
            return this.group
        },
        getCodePurchase(): any {
            return this.codePurchase
        },
        getFriends(): object[] {
            return this.friends
        },
        getCountWarnings(): number {
            return this.countWarnings
        },
        getCountFriendRequests(): number {
            return this.countFriendRequests
        },
        getCountTotalMenu(): number {
            return this.countFriendRequests
        }
    }
})


