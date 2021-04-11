import axios from 'axios'
import { PROXY_URL } from '../constants'
import { IDeskAssignment } from './UserService'

export interface IAsset {
    id: string
}

export interface IAssetService {
    assignUser: Function,
    removeUser: Function,
    fetchFloorAssets: Function,
    fetchAssetsCustomField: Function
}

export const assignedToPath = 'properties.customFields.assignedTo'

const resourceType = 'asset'

const assignUser = (deskAssignment: IDeskAssignment) => {
    return axios.put(`${PROXY_URL}/v2/${resourceType}/${deskAssignment.deskId}/custom-field/${assignedToPath}`, { userId: deskAssignment.userId })
}

const removeUser = (assetId: string) => {
    return axios.delete(`${PROXY_URL}/v2/${resourceType}/${assetId}/custom-field/${assignedToPath}`)
}

const fetchFloorAssets = (floorId: string) => {
    return axios.get(`${PROXY_URL}/v2/${resourceType}/?floorId=${floorId}`)
}

const fetchAssetsCustomField = (assetsId: string[]) => {
    const allRequests = assetsId.map(id => axios.get(`${PROXY_URL}/v2/${resourceType}/${id}/custom-field`))

    return axios.all(allRequests)
}

const AssetService: IAssetService = {
    assignUser: assignUser,
    removeUser: removeUser,
    fetchFloorAssets: fetchFloorAssets,
    fetchAssetsCustomField: fetchAssetsCustomField
}

export default AssetService