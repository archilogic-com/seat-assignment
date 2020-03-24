import axios from 'axios'
import { IDeskAssignment } from './UserService'
import { PROXY_URL } from '../constants'

export interface IAsset {
    id: string
}

export interface IAssetService {
    assignUser: Function,
    removeUser: Function,
    fetchFloorAssets: Function
}

export const assignedToPath = 'properties.customFields.assignedTo'
const resourceType = 'asset'

const assignUser = (deskAssignment: IDeskAssignment) => {
    return axios.put(`${PROXY_URL}/v1/${resourceType}/${deskAssignment.deskId}/custom-field/${assignedToPath}`, {userId: deskAssignment.userId})
}

const removeUser = (assetId: string) => {
    return axios.delete(`${PROXY_URL}/v1/${resourceType}/${assetId}/custom-field/${assignedToPath}`)
}

const fetchFloorAssets = (floorId: string) => {
    return axios.get(`${PROXY_URL}/v1/${resourceType}?floorId=${floorId}`)
}

const AssetService: IAssetService = {
    assignUser: assignUser,
    removeUser: removeUser,
    fetchFloorAssets: fetchFloorAssets
}

export default AssetService