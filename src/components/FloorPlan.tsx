import React, { useEffect, useState, useRef } from 'react'
import _ from 'lodash'

import { findById } from '../shared/Helpers'
import UserService, { IDeskAssignment } from '../shared/services/UserService'

declare var FloorPlanEngine: any

const containerId = 'floor-plan'

const floorPlanStartupSettings = {
    hideElements: [],
    panZoom: true,
    planRotation: 0,
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
export const deskTags = ['table', 'work table']

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
    const [clickedDesk, setClickedDesk] = useState<any>()

    const isDesk = (furnitureItem: any) => {
        return _.some(deskTags, (tag) => {
            return _.includes(furnitureItem.tags, tag)
        })
    }

    // highlight assets that are desks
    const highlightDesks = (spaces: Array<any>, furniture: Array<any>) => {
        const desks: any[] = []
        spaces.forEach((space: any) => {
            if (space.usage === "work" || space.usage === "openWorkspace") {
                space.assets.forEach((furnitureItemId: string) => {
                    const furnitureItem = findById(furniture, furnitureItemId)
                    if (furnitureItem && isDesk(furnitureItem)) {
                        highlightDesk(furnitureItem)
                        desks.push(furnitureItem)
                    }
                })
            }
        })
        setDesks(desks)
    }

    const highlightDesk = (furnitureItem: any) => {
        furnitureItem.node.setHighlight({ fill: colors.assignable })
    }

    // highlight assigned desks
    const highlightAssignedDesks = (deskAssignments: Array<IDeskAssignment>, desks: Array<any>) => {
        deskAssignments.forEach((deskAssignment: IDeskAssignment) => {
            const furnitureItem = findById(desks, deskAssignment.deskId)
            const user = UserService.findById(deskAssignment.userId)

            if (!furnitureItem || !user) return

            highlightAssignedDesk(furnitureItem)
        })
    }

    const highlightAssignedDesk = (furnitureItem: any) => {
        furnitureItem.node.setHighlight({ fill: colors.assigned })
    }

    // load floorPlan and highlight desks
    useEffect(() => {
        const container = document.getElementById(containerId)
        const floorPlan = new FloorPlanEngine(container, floorPlanStartupSettings)
        const publishableToken = process.env.REACT_APP_PUBLISHABLE_TOKEN

        floorPlan.loadScene(sceneId, { publishableToken }).then(() => {
            const spaces = floorPlan.resources.spaces || []
            const furniture = floorPlan.resources.assets || []
            setFloorPlan(floorPlan)
            highlightDesks(spaces, furniture)

            floorPlan.on('drop', (event: any) => onDrop(event, floorPlan));
            floorPlan.on('click', (event: any) => onDeskClick(event, floorPlan));
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // highlight assigned desks, we only want to execute it once, when desk assignments are loaded
    useEffect(() => {
        if (desks.length === 0) return
        if (deskAssignments.length === 0) return
        if (deskAssignmentsLoaded.current === true) return
        highlightAssignedDesks(deskAssignments, desks)
        deskAssignmentsLoaded.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deskAssignments, desks, floorPlan])

    // handle assignment removal
    useEffect(() => {
        if (!removedDeskAssignment) return

        const furnitureItem = findById(desks, removedDeskAssignment.deskId)
        if (!furnitureItem) return

        highlightDesk(furnitureItem)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [removedDeskAssignment, desks, floorPlan])

    useEffect(() => {
        if (!clickedDesk || !floorPlan) return

        const assignment = _.find(deskAssignments, (item) => {
            return String(item.deskId) === String(clickedDesk.id)
        });

        if (!assignment) return;
        const user = UserService.findById(assignment.userId)

        clickedDesk.infoWindow = floorPlan.addInfoWindow({
            pos: [clickedDesk.position.x, clickedDesk.position.z],
            width: 150,
            height: 80,
            html: '<div>' +
                '<div class="user-photo"><img src="' + user.photoUrl + '"/></div>' +
                '<div class="user-name">' + user.firstName + ' ' + user.lastName + '</div>' +
                '</div>',
            closeButton: false
        })

        return () => { clickedDesk.infoWindow.remove(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clickedDesk, deskAssignments, floorPlan])

    const onDeskClick = (event: any, floorPlan: any) => {
        const { assets } = floorPlan.getResourcesFromPosition(event.pos);
        if (assets.length === 0 || !isDesk(assets[0])) return;
        const furnitureItem = assets[0];

        setClickedDesk(furnitureItem);
    }

    const onDrop = (archilogicEvent: any, floorPlan: any) => {
        const event = archilogicEvent.sourceEvent;

        event.preventDefault();

        const position = [event.offsetX, event.offsetY];
        const { assets } = floorPlan.getResourcesFromPosition(floorPlan.getPlanPosition(position));

        if (assets.length === 0 || !isDesk(assets[0])) return;
        const furnitureItem = assets[0];

        const userId = event?.dataTransfer?.getData('text')

        if (!userId) return;

        const user = UserService.findById(parseInt(userId))

        if (!furnitureItem || !user) return

        addDeskAssignment({
            userId: parseInt(userId),
            deskId: furnitureItem.id
        })

        highlightAssignedDesk(furnitureItem)
    }

    return (
        <div id={containerId}></div>
    )

}

export default FloorPlan