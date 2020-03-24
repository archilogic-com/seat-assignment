import React, { useState, useEffect, DragEvent } from 'react'
import { IUser, IUserElement, IDeskAssignment } from '../shared/services/UserService'
import { CloseCircleOutlined } from '@ant-design/icons'
import { Row, Col } from 'antd'
import _ from 'lodash'

interface UsersListProps {
    users: Array<IUserElement>,
    deskAssignments: Array<IDeskAssignment>,
    sceneId: string,
    setUsers: Function,
    removeDeskAssignment: Function,
    loading: boolean
}

enum UserDragUpdateType {
    start = "start",
    stop = "stop"
}

interface IUserDragUpdate {
    type: string,
    userId?: number
}

const UsersList = (props: UsersListProps) => {
    const { 
        users, 
        deskAssignments, 
        sceneId, 
        setUsers, 
        removeDeskAssignment,
        loading 
    } = props

    const [userDragUpdate, collectUserDragUpdate] = useState<IUserDragUpdate>()

    const isUserAssigned = (user: IUser, sceneId: string) => {
        return _.some(deskAssignments, function(item) {
            return item.userId === user.id
        })
    } 
    
    const assignedStatus = (user: IUserElement) => {
        if (loading === true || user.isLoading === true) return '...'
        if (user.isDragging === true) return "Assigning..."
        if (isUserAssigned(user, sceneId)) return "Assigned"
        return "No desk"
    }

    const isDraggable = (user: IUser) => {
        return !isUserAssigned(user, sceneId)
    }

    const removeAssignment = (user: IUser) => {
        const assignment = _.find(deskAssignments, (item) => {
            return item.userId === user.id
        })

        removeDeskAssignment(assignment)
    }

    useEffect(() => {
        // we use userDragUpdate to store user updates and apply them in a useEffect call to properly
        // update the state
        if(!_.isUndefined(userDragUpdate)) {
            switch(userDragUpdate.type) {
                case UserDragUpdateType.start:
                    setUsers(users?.map((stateUser) => {
                        return stateUser.id === userDragUpdate.userId ? {...stateUser, "isDragging": true} : stateUser
                    }))
                    break
                case UserDragUpdateType.stop:
                default:    
                    setUsers(users?.map((stateUser) => {
                        return stateUser.isDragging === true ? {...stateUser, "isDragging": false} : stateUser
                    }))
                    break
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userDragUpdate])

    const onDragStart = (event: DragEvent, user: IUserElement) => {
        const elem = event.currentTarget
    
        // change status to draggable element so that it is used in its dragging copy
        elem.children[0].children[1].children[1].innerHTML = "Assigning..."
    
        collectUserDragUpdate({
            type: UserDragUpdateType.start,
            userId: user.id
        })
    
        elem.classList.add('drag-active')
        event.dataTransfer.setData('text/plain', String(user.id))
    }
    
    const onDragEnd = (event: DragEvent) => {
        const elem = event.currentTarget
        elem.classList.remove('drag-active')  

        collectUserDragUpdate({
          type: UserDragUpdateType.stop
        })
    }

    return (
        <ul>
          {users?.map((user, index) => {
            return (
              <li
                data-user-id={user.id}
                key={index}
                draggable={isDraggable(user)}
                className={(isDraggable(user) ? 'draggable' : '')}
                onDragStart={(e) => {onDragStart(e, user)}} 
                onDragEnd={onDragEnd} 
              >
                <Row>
                  <Col span={6}>
                    <div className="user-photo">
                      <img alt={user.firstName + ' ' + user.lastName} src={user.photoUrl}/>
                    </div>
                  </Col>
                  <Col span={14}>
                    <div className="user-name">{user.firstName} {user.lastName}</div>
                    <div className="user-assignment">{assignedStatus(user)}</div>
                  </Col>
                  <Col span={4}>
                    {isUserAssigned(user, sceneId) &&
                    <span className="remove-assignment" onClick={ () => { removeAssignment(user)}}><CloseCircleOutlined /></span>
                    }
                  </Col>
                </Row>    
              </li>
            )
          })}
          </ul>
    )
}

export default UsersList