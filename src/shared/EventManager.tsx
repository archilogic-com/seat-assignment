import _ from 'lodash'

/**
 * Class to manage registering and removing dom event listeners.
 * Main use is to handle anonymous functions, as we need to reference the same function in order to
 * remove the listener
 * https://medium.com/@DavideRama/removeeventlistener-and-anonymous-functions-ab9dbabd3e7b
 */

const eventStore: any = {}
export enum EventType {
    drop = 'drop',
    click = 'click',
    dragover = 'dragover'
}

const register = (domElement: any, eventType: EventType, callback: Function) => {
    domElement.addEventListener(eventType, callback)
    save(domElement.id, eventType, callback)
}

const unregister = (domElement: any, eventType: EventType) => {
    const callback = findCallback(domElement.id, eventType)
    if (!callback) return
    domElement.removeEventListener(eventType, callback)
    remove(domElement.id, eventType)
}

const save = (domElementId: string, eventType: EventType, callback: Function) => {
    if (_.isUndefined(eventStore[eventType])) {
        eventStore[eventType] = {}
    }

    eventStore[eventType][domElementId] = callback
}

const remove = (domElementId: string, eventType: any) => {
    delete eventStore[eventType][domElementId]
}

const findCallback = (domElementId: string, eventType: string) => {
    if (!eventStore[eventType] || !eventStore[eventType][domElementId]) return
    return eventStore[eventType][domElementId]
}

export const EventManager = {
    registerEvent: register,
    unregisterEvent: unregister
}