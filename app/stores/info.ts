import { defineStore } from 'pinia';

export interface InterfaceInfo {
    info: object,
    extras: object[],
    spots: object[],
    client: any,
    github_short: null | string,
    github_image: null | string,
    endpoint_current: null | string,
}

export const useInfo = defineStore('info', {
    state: (): InterfaceInfo => ({
        info: {},
        extras: [],
        spots: [],
        client: {},
        github_short: null,
        github_image: null,
        endpoint_current: null
    }),
    actions: {
        setInfo(dataInfo: object) {
            this.info = dataInfo
        },
        setExtras(dataExtras: object[]) {
            this.extras = dataExtras
        },
        setSpots(dataSpots: object[]) {
            this.spots = dataSpots
        },
        setClient(dataClient: object) {
            this.client = dataClient
        },
        setGithubShort(dataShort: string) {
            this.github_short = dataShort
        },
        setGithubImage(dataImage: string) {
            this.github_image = dataImage
        },
        setEndpointCurrent(dataEndpoint: string) {
            this.endpoint_current = dataEndpoint
        }
    },
    getters: {
        myReturn(): object {
            return {
                info: this.info,
                all_extras: this.extras,
                all_spots: this.spots
            }
        },
        getEndpoints(): any {
            return this.client.backend_list
        }
    }
})

