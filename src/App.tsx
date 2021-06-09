import { Layout } from 'antd'
import 'antd/dist/antd.css'
import axios from 'axios'
import _ from 'lodash'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import './App.css'
import FloorPlan, { deskTags } from './components/FloorPlan'
import Navigation from './components/Navigation'
import UsersList from './components/UsersList'
import { DEFAULT_SCENE_ID } from './shared/constants'
import AssetService from './shared/services/AssetService'
import FloorService, { IFloor } from './shared/services/FloorService'
import UserService, { IDeskAssignment, IUserElement } from './shared/services/UserService'

const App = () => {
  const { Sider, Content } = Layout
  const urlParams = new URLSearchParams(window.location.search)
  const sceneId = urlParams.get('sceneId') || DEFAULT_SCENE_ID

  const [users, setUsers] = useState<Array<IUserElement>>([])
  const [deskAssignments, setDeskAssignments] = useState<Array<IDeskAssignment>>([])
  const [loading, isLoading] = useState<boolean>(false)
  const [deskAssignment, addDeskAssignment] = useState<IDeskAssignment>()
  const [removedDeskAssignment, removeDeskAssignment] = useState<IDeskAssignment>()
  const [floor, setFloor] = useState<IFloor>()

  const [token, setToken] = useState<string>()

  useLayoutEffect(() => {

    // get temporary token
    let tempToken: null | string = null
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/temp-token`).then(response => {
      tempToken = response?.data?.authorization
      if (!tempToken) return;

      setToken(tempToken)

      axios.interceptors.request.use((config) => {
        config.params = config.params || {};

        if (tempToken) {
          config.headers.common['Authorization'] = tempToken;
        }
        return config;
      }, (error) => {
        console.log(error)
        return Promise.reject(error);
      });
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sceneId || !token) return

    isLoading(true)

    // load users
    setUsers(UserService.getAll())

    // load floor data
    FloorService.findById(sceneId).then((response: any) => {
      setFloor({
        id: response.data.id,
        name: response.data.properties.name
      })
    })

    // get floor's assets to load already  existing desk assignments
    AssetService.fetchFloorAssets(sceneId).then((response: any) => {
      const deskAssets = response.data.features.filter((f: any) => f.properties.tags.find((t: any) => deskTags.includes(t)))
      const deskAssetsIds = deskAssets.map((d: any) => d.id)
      AssetService.fetchAssetsCustomField(deskAssetsIds).then(axios.spread((...responses: any[]) => {
        const deskAssignments = deskAssetsIds.map((id: string, index: number) => {
          if (responses[index]?.data.properties && responses[index].data.properties.customFields.assignedTo?.userId) {
            return {
              deskId: id,
              userId: responses[index].data.properties.customFields.assignedTo.userId
            }
          }
          return undefined
        }).filter((da: any) => da !== undefined)
        setDeskAssignments(deskAssignments)
      })).finally(() => { isLoading(false) })
    })

  }, [sceneId, token])

  useEffect(() => {
    // remove desk assignment
    if (!removedDeskAssignment) return

    setUsers(users?.map((stateUser) => {
      return stateUser.id === removedDeskAssignment.userId ? { ...stateUser, "isLoading": true } : stateUser
    }))

    AssetService.removeUser(removedDeskAssignment.deskId).then(() => {
      setDeskAssignments(deskAssignments.filter((item) => {
        return item.deskId !== removedDeskAssignment.deskId
      }))
      setUsers(users?.map((stateUser) => {
        return stateUser.id === removedDeskAssignment.userId ? { ...stateUser, "isLoading": false } : stateUser
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
      return stateUser.id === deskAssignment.userId ? { ...stateUser, "isLoading": true } : stateUser
    }))

    // add assignment
    AssetService.assignUser(deskAssignment).then(() => {
      if (assignmentToReplace) {
        setDeskAssignments(deskAssignments.filter((item) => {
          return item.deskId !== assignmentToReplace.deskId
        }).concat(deskAssignment))
      } else {
        setDeskAssignments(deskAssignments.concat(deskAssignment))
      }

      setUsers(users?.map((stateUser) => {
        return stateUser.id === deskAssignment.userId ? { ...stateUser, "isLoading": false, "isDragging": false } : stateUser
      }))
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deskAssignment])

  return (
    <div className="App">
      <Layout>
        <Sider>
          <Navigation floor={floor} />
          <hr />
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
