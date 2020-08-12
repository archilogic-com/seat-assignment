import React, { useEffect, useState, useRef, DragEvent } from 'react'
import _ from 'lodash'

import { findById, getElementByFurnitureItemId } from '../shared/Helpers'
import UserService, { IDeskAssignment, IUser } from '../shared/services/UserService'
import { EventManager, EventType } from '../shared/EventManager'

declare var FloorPlanEngine: any

const containerId = 'floor-plan'

const floorPlanStartupSettings = {
    hideElements: [],
    panZoom: true,
    planRotation: 180,
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
}

// tags used to establish which assets are 'assignable'
const deskTags = ['table', 'work table']

const colors = {
  assignable: [0, 184, 148],
  assigned: [225, 112, 85]
} 

interface FloorPlanProps {
    sceneId: string,
    deskAssignments: Array<IDeskAssignment>,
    addDeskAssignment: Function,
    removedDeskAssignment?: IDeskAssignment
}

const FloorPlan = (props: FloorPlanProps) => {
    const { 
        sceneId, 
        deskAssignments,
        addDeskAssignment,
        removedDeskAssignment
    } = props

    const deskAssignmentsLoaded = useRef(false)

    const [desks, setDesks] = useState<any>([])
    const [floorPlan, setFloorPlan] = useState<any>()

    const isDesk = (furnitureItem: any) => {
        return _.some(deskTags, (tag) => {
          return _.includes(furnitureItem.tags, tag)
        })
    }

    // highlight assets that are desks
    const highlightDesks = (spaces: Array<any>, furniture: Array<any>, floorPlan: any) => {
        const desks: any[] = []
        spaces.forEach((space: any) => {
            if (space.usage === "work") {
                space.assets.forEach((furnitureItemId: string) => {
                    const furnitureItem = findById(furniture, furnitureItemId)
                    if (furnitureItem && isDesk(furnitureItem)) {
                        highlightDesk(furnitureItem, floorPlan)
                        desks.push(furnitureItem)
                    }
                })
            }
        })
        setDesks(desks)
    }

    const highlightDesk = (furnitureItem: any, floorPlan: any) => {
        furnitureItem.node.setHighlight({fill: colors.assignable})
        const elem = getElementByFurnitureItemId(furnitureItem.id)
        elem?.classList.remove('desk-assigned')
        // EventManager.registerEvent(elem, EventType.dragover, onDragOver)
        // EventManager.registerEvent(elem, EventType.drop, (e: DragEvent) => { onDrop(e, furnitureItem, floorPlan) })
        // EventManager.unregisterEvent(elem, EventType.click)
        // furnitureItem.on('click', ()=>{alert(123)})

    }

    // highlight assigned desks
    const highlightAssignedDesks = (deskAssignments: Array<IDeskAssignment>, desks: Array<any>, floorPlan: any ) => {
        deskAssignments.forEach( (deskAssignment: IDeskAssignment) => {
            const furnitureItem = findById(desks, deskAssignment.deskId)
            const user = UserService.findById(deskAssignment.userId)
            
            if (!furnitureItem || !user) return

            highlightAssignedDesk(furnitureItem, user, floorPlan)
        })
    }

    const highlightAssignedDesk = (furnitureItem: any, user: IUser, floorPlan: any) => {
        furnitureItem.node.setHighlight({fill: colors.assigned})
        const elem = getElementByFurnitureItemId(furnitureItem.id)
        elem?.classList.add('desk-assigned')
        // EventManager.registerEvent(elem, EventType.click, () => { onDeskClick(user, furnitureItem, floorPlan) })
        // EventManager.unregisterEvent(elem, EventType.dragover)
        // EventManager.unregisterEvent(elem, EventType.drop)
    }

    // load floorPlan and highlight desks
    useEffect(() => {
        const container = document.getElementById(containerId)
        const floorPlan = new FloorPlanEngine(container, floorPlanStartupSettings)
        floorPlan.loadScene(sceneId).then(() => {
            const spaces = floorPlan.resources.spaces || []
            const furniture = floorPlan.resources.assets || []
            setFloorPlan(floorPlan)
            highlightDesks(spaces, furniture, floorPlan)
            floorPlan.on('drop', (e: any) => {
                const position = [e.clientX, e.clientY];
                console.log(e);
                console.log(floorPlan.getResourcesFromPosition(floorPlan.getPlanPosition(position)))
            });
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // highlight assigned desks, we only want to execute it once, when desk assignments are loaded
    useEffect(() => {
        if (desks.length === 0) return
        if (deskAssignmentsLoaded.current === true) return
        highlightAssignedDesks(deskAssignments, desks, floorPlan)
        deskAssignmentsLoaded.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deskAssignments, desks, floorPlan])

    // handle assignment removal
    useEffect(() => {
        if (!removedDeskAssignment) return

        const furnitureItem = findById(desks, removedDeskAssignment.deskId)
        if (!furnitureItem) return

        highlightDesk(furnitureItem, floorPlan)
        
        // remove all info windows if any was opened previously
        while (document.querySelector(".fpe-info-window")) {
            const infoWindow = document.querySelector(".fpe-info-window")
            infoWindow?.remove()
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [removedDeskAssignment, desks, floorPlan])

    const onDeskClick = (user: IUser, furnitureItem: any, floorPlan: any) => {
        floorPlan.addInfoWindow({
          pos: [furnitureItem.position.x, furnitureItem.position.z],
          width: 150,
          height: 80,
          html: '<div>' + 
                  '<div class="user-photo"><img src="'+user.photoUrl+'"/></div>' + 
                  '<div class="user-name">'+user.firstName+' '+user.lastName+'</div>' + 
                '</div>',
          closeButton: true
        })
    }

    const onDragOver = (event: DragEvent) => {
        event.preventDefault()
    }
    
    const onDrop = (event: DragEvent, furnitureItem: any, floorPlan: any) => {
        event.preventDefault()
        
        const userId = event
            .dataTransfer
            .getData('text')
        
        if (userId) {
            const user = UserService.findById(parseInt(userId))

            if (!furnitureItem || !user) return

            addDeskAssignment({
                userId: parseInt(userId), 
                deskId: furnitureItem.id
            })

            highlightAssignedDesk(furnitureItem, user, floorPlan)
        }
    }

    return (
        <div id={containerId}></div>
    )

}

export default FloorPlan