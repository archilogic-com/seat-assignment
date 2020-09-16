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
    return axios.get(`${PROXY_URL}/v1/floor/${floorId}?token=${process.env.REACT_APP_ARCHILOGIC_PUBLISHABLE_API_KEY}`)
}
const FloorService: IFloorService = {
    findById: findById
}

export default FloorService

    

    
