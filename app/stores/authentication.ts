import { defineStore } from 'pinia';

export interface InterfaceShow {
    token: string,
    user: object,
    userId: string,
    info: object,
    profile: object,
    profileId: string,
    group: object,
    codePurchase: string,
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
        codePurchase: ''
    }),
    actions: {
        setToken(dataToken: string) {
            this.token = dataToken
        },
        setUser(dataUser: object) {
            this.user = dataUser
        },
        setUserId(dataUserId: string) {
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
        setCodePurchase(dataCodePurchase: string) {
            this.codePurchase = dataCodePurchase
        }
    },
    getters: {
        getToken(): string {
            return this.token
        },
        getUser(): object {
            return this.user
        },
        getUserId(): string {
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
        getCodePurchase(): string {
            return this.codePurchase
        }
    }
})


