import axios from 'axios'
import { PROXY_URL } from '../constants'

export interface IFloor {
    id: string,
    name: string
}

export interface IFloorService {
    findById: Function
}


const findById = (floorId: string) => {
    return axios.get(`${PROXY_URL}/v2/floor/${floorId}`)
}
const FloorService: IFloorService = {
    findById: findById
}

export default FloorService

    

    
