import React from 'react'
import { IFloor } from '../shared/services/FloorService'

interface NavigationProps {
    floor?: IFloor
}

const Navigation = (props: NavigationProps) => {
    const { floor } = props
    return (
        <div className="nav">
            <div className="nav-item">{floor ? floor.name : 'loading...'}</div>
        </div>
    )
}

export default Navigation