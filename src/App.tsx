import React, { useEffect, useState } from 'react'
import { Layout } from 'antd'
import _ from 'lodash'

import FloorPlan from './components/FloorPlan'
import Navigation from './components/Navigation'
import UsersList from './components/UsersList'

import UserService, { IUserElement, IDeskAssignment } from './shared/services/UserService'
import FloorService, { IFloor } from './shared/services/FloorService'

import './App.css'
import 'antd/dist/antd.css'
import AssetService, { assignedToPath } from './shared/services/AssetService'
import { DEFAULT_SCENE_ID } from './shared/constants'

const App = () => {
  const { Sider, Content } = Layout
  const urlParams = new URLSearchParams(window.location.search)
  const sceneId = urlParams.get('scene') || DEFAULT_SCENE_ID

  const [users, setUsers] = useState<Array<IUserElement>>([])
  const [deskAssignments, setDeskAssignments] = useState<Array<IDeskAssignment>>([])
  const [loading, isLoading] = useState<boolean>(false)
  const [deskAssignment, addDeskAssignment] = useState<IDeskAssignment>()
  const [removedDeskAssignment, removeDeskAssignment] = useState<IDeskAssignment>()
  const [floor, setFloor] = useState<IFloor>()

  useEffect(() => {
    isLoading(true)

    // load users
    setUsers(UserService.getAll())

    // load floor data
    FloorService.findById(sceneId).then( (response: any) => {
      setFloor({
        id: response.data.id,
        name: response.data.properties.name
      })
    })

    // get floor's assets to load already existing desk assignments
    AssetService.fetchFloorAssets(sceneId).then( (response: any) => {
      setDeskAssignments(response.data.features.filter( (feature: any) => {
        return !_.isUndefined(_.get(feature, assignedToPath+'.userId'))
      }).map( (feature: any) => {
        return {
          deskId: feature.id,
          userId: _.get(feature, assignedToPath+'.userId')
        }
      }))
      isLoading(false)
    })
  }, [sceneId])

  useEffect(() => {
    // remove desk assignment
    if (!removedDeskAssignment) return

    setUsers(users?.map((stateUser) => {
      return stateUser.id === removedDeskAssignment.userId ? {...stateUser, "isLoading": true} : stateUser
    }))

    AssetService.removeUser(removedDeskAssignment.deskId).then( () => {
      setDeskAssignments(deskAssignments.filter( (item) => {
          return item.deskId !== removedDeskAssignment.deskId 
      }))
      setUsers(users?.map((stateUser) => {
        return stateUser.id === removedDeskAssignment.userId ? {...stateUser, "isLoading": false} : stateUser
      }))
    })
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedDeskAssignment])

  useEffect(() => {
    // add desk assignment
    if (!deskAssignment) return
    
    // check if the desk was taken to clear out previous assignment
    const assignmentToReplace = _.find(deskAssignments, (item) => {
      return String(item.deskId) === String(deskAssignment.deskId)
    });

    setUsers(users?.map((stateUser) => {
      return stateUser.id === deskAssignment.userId ? {...stateUser, "isLoading": true} : stateUser
    }))

    // add assignment
    AssetService.assignUser(deskAssignment).then( () => {
      if (assignmentToReplace) {
        setDeskAssignments(deskAssignments.filter( (item) => {
          return item.deskId !== assignmentToReplace.deskId 
        }).concat(deskAssignment))
      } else {
        setDeskAssignments(deskAssignments.concat(deskAssignment))
      }
      
      setUsers(users?.map((stateUser) => {
        return stateUser.id === deskAssignment.userId ? {...stateUser, "isLoading": false, "isDragging": false} : stateUser
      }))
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deskAssignment])
  
  return (
    <div className="App">
      <Layout>
        <Sider>
          <Navigation floor={floor}/>
          <hr/>
          <UsersList 
            users={users} 
            deskAssignments={deskAssignments} 
            sceneId={sceneId} 
            setUsers={setUsers}
            removeDeskAssignment={removeDeskAssignment}
            loading={loading}
          />
        </Sider>
        <Layout>
          <Content>
            <FloorPlan 
              sceneId={sceneId} 
              deskAssignments={deskAssignments}
              addDeskAssignment={addDeskAssignment}
              removedDeskAssignment={removedDeskAssignment}
              />
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}

export default App
