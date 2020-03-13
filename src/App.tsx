import React, { useEffect, useState } from 'react';
import { Layout, Row, Col } from 'antd';
import { RightOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { UserDb, IUser } from './services/UserService';
import { EventManager } from './services/EventManager';
import { getDomElementByFurnitureId } from './services/Helpers'
import _ from 'lodash';

import './App.css';
import 'antd/dist/antd.css';

declare var FloorPlanEngine: any;

interface IUIUser extends IUser {
  isDragging: boolean,
  isLoading: boolean
}

interface IUserChange {
  type: string,
  value?: any,
  userId?: number
}

const App = () => {
  const { Sider, Content } = Layout;
  const [users, setUsers] = useState<Array<IUIUser>>()
  const [spaces, setSpaces] = useState<any>([])
  const [furniture, setFurniture] = useState<any>([])
  const [desks, setDesks] = useState<any>([])
  const [floorPlan, setFloorPlan] = useState()
  const [userChanges, setUserChanges] = useState<IUserChange>()

  const urlParams = new URLSearchParams(window.location.search);
  const sceneId = urlParams.get('scene');

  const demoSceneId = sceneId || 'a9aaafdf-d5b6-4b4a-82a0-9efb6d5b155a';

  const findFurnitureById = (id: string) => {
    return _.find(furniture, (item) => {
      return item.id === id;
    })
  }

  const findUserById = (id: string) => {
    return _.find(users, (item) => {
      return item.id === parseInt(id);
    })
  }

  const assignedStatus = (user: IUIUser) => {
    if (user.isDragging === true) return "Assigning...";
    if (user.deskId && user.sceneId === demoSceneId) return "Assigned";
    return "No desk"
  }

  const onDragStart = (event: any) => {
    const elem = event.currentTarget;
    const userId = event.target.getAttribute('data-user-id');
    const user = findUserById(userId)

    elem.children[0].children[1].children[1].innerHTML = "Assigning..."

    if (user) {
      setUserChanges({
        type: 'drag',
        userId: user.id,
        value: true
      })
    }

    elem
      .classList.add('drag-active');

    event
      .dataTransfer
      .setData('text/plain', userId)
  }

  const onDragEnd = (event: any) => {
    const elem = event.currentTarget;
 
    setUserChanges({
      type: 'dragStop'
    })
    
    elem
      .classList.remove('drag-active')   
  }

  const onDragOver = (event: any) => {
    event.preventDefault()
  }

  const onDrop = (event: any) => {
    event.preventDefault();
  
    const userId = event
      .dataTransfer
      .getData('text');
    
    const user = findUserById(userId)
    const deskId = event.currentTarget.id.replace('el-', '')

    const furniture = findFurnitureById(deskId);
    if (furniture && user) {
      assignSeat(furniture, user)
    }
  }

  const unAssignSeat = (user: any) => {
    const furniture = findFurnitureById(user.deskId)
    const elem = getDomElementByFurnitureId(furniture.id)
    elem?.classList.remove('seat-assigned')
    EventManager.unregisterEvent(elem, 'click')
    EventManager.registerEvent(elem, 'drop', onDrop)
    furniture.node.setHighlight({fill: [0, 184, 148]});
    
    setUserChanges({
      type: 'desk',
      userId: user.id,
      value: ''
    })
    UserDb.updateRow(user.id, {deskId: '', sceneId: demoSceneId}) 
  }

  const onFurnitureClick = (user: any, furniture: any) => {
    floorPlan.addInfoWindow({
      pos: [furniture.position.x, furniture.position.z],
      width: 150,
      height: 80,
      html: '<div>' + 
              '<div class="user-photo"><img src="'+user.photoUrl+'"/></div>' + 
              '<div class="user-name">'+user.firstName+' '+user.lastName+'</div>' + 
            '</div>',
      closeButton: true
    })
  }

  const assignSeat = (furniture: any, user: any) => {
    furniture.node.setHighlight({fill: [225, 112, 85]});
    const elem = getDomElementByFurnitureId(furniture.id)
    EventManager.registerEvent(elem, 'click', () => { onFurnitureClick(user, furniture) })
    EventManager.unregisterEvent(elem, 'drop')
    elem?.classList.add('seat-assigned')

    setUserChanges({
      type: 'desk',
      userId: user.id,
      value: furniture.id
    })
    UserDb.updateRow(user.id, {deskId: furniture.id, sceneId: demoSceneId})
  }

  const isDraggable = (user: any) => {
     return !(user.deskId && user.sceneId === demoSceneId) 
  }

  useEffect(() => {
    const container = document.getElementById('hello-plan');
    const startupSettings = {
      hideElements: [],
      panZoom: true,
      planRotation: null,
      roomStampSize: null,
      ui: {
          menu: false,
          scale: false,
          coordinates: false
      },
      theme: {
          background: {
              color: '#f3f5f8',
              showGrid: false
          },
          wallContours: false,
          elements: {
              roomstamp: { showArea: false }
          }
      },
      units: {
          system: 'metric',
          digits: 0,
          roomDimensions: 'area'
      }
    };

    const dbUsers = UserDb.all()
    const uiUsers = dbUsers.map((dbUser)=>{
      return _.assign(dbUser, {
        isLoading: false,
        isDragging: false
      });
    })

    setUsers(uiUsers)

    const fp = new FloorPlanEngine(container, startupSettings);
    setFloorPlan(fp);
    fp.loadScene(demoSceneId).then(() => {
      setSpaces(fp.state.computed.spaces)
      setFurniture(fp.state.computed.furniture)
    });

  }, [])

  useEffect(() => {
    spaces.forEach((space: any) => {
      if (space.usage === "Work") {
        space.furniture.forEach((furnitureId: string) => {
          const furniture = findFurnitureById(furnitureId);
          if (furniture && ( _.includes(furniture.productData.tags, 'work table') || _.includes(furniture.productData.tags, 'table'))) {
            furniture.node.setHighlight({fill: [0, 184, 148]});
            const elem = getDomElementByFurnitureId(furnitureId);
            EventManager.registerEvent(elem, 'dragover', onDragOver)
            EventManager.registerEvent(elem, 'drop', onDrop)
            setDesks([...desks, furniture])
          }
        })
      }
    });

    users?.forEach((user) => {
      if(user.deskId && user.sceneId === demoSceneId) {
        spaces.forEach((space: any) => {
          if (space.usage === "Work") {
            space.furniture.forEach((furnitureId: string) => {
              if (furnitureId === user.deskId && user.sceneId === demoSceneId) {
                const furniture = findFurnitureById(furnitureId);
                assignSeat(furniture, user)
              }
            })
          }
        });
      }
    })

  }, [furniture])

  useEffect(() => {
    if(!_.isUndefined(userChanges)) {
      switch(userChanges.type) {
        case "drag":
          setUsers(users?.map((stateUser) => {
            return stateUser.id === userChanges.userId ? {...stateUser, "isDragging": userChanges.value} : stateUser;
          }))
          break;
        case "desk":
          setUsers(users?.map((stateUser) => {
            return stateUser.id === userChanges.userId ? {...stateUser, "deskId": userChanges.value, "sceneId": demoSceneId} : stateUser;
          }))
          break;
        case "dragStop":
          setUsers(users?.map((stateUser) => {
            return stateUser.isDragging === true ? {...stateUser, "isDragging": false} : stateUser;
          }))
          break;  
      }
    }
  }, [userChanges])  

  return (
    <div className="App">
      <Layout>
        <Sider>
          <div className="nav">
            Boston HQ <RightOutlined /> 11 Farnsworth
            <div className="nav-item">Floor 2 </div>
          </div>
          <hr/>
          <ul>
          {users?.map((user, index) => {
            return (
              <li
                data-user-id={user.id}
                draggable={isDraggable(user)} 
                onDragStart={onDragStart} 
                onDragEnd={onDragEnd}
                key={index}
                className={(isDraggable(user) ? 'draggable' : '')}
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
                    {user.deskId && user.sceneId === demoSceneId &&
                    <span className="remove-assignment" onClick={ () => { unAssignSeat(user)}}><CloseCircleOutlined /></span>
                    }
                  </Col>
                </Row>    
              </li>
            )
          })}
          </ul>
        </Sider>
        <Layout>
          <Content>
            <div id="hello-plan"></div>
          </Content>
        </Layout>
      </Layout>
      
    </div>
  );
}

export default App;
