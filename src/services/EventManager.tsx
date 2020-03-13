import _ from 'lodash';

const eventStore: any = {};

const register = (domElement: any, eventType: any, callback: any) => {
    domElement.addEventListener(eventType, callback)
    save(domElement.id, eventType, callback)
}

const unregister = (domElement: any, eventType: any) => {
    domElement.removeEventListener(eventType, findCallback(domElement.id, eventType))
    remove(domElement.id, eventType)
}

const save = (domElementId: string, eventType: any, callback: any) => {
    if (_.isUndefined(eventStore[eventType])) {
        eventStore[eventType] = {}
    }

    eventStore[eventType][domElementId] = callback;
}

const remove = (domElementId: string, eventType: any) => {
    delete eventStore[eventType][domElementId];
}

const findCallback = (domElementId: string, eventType: string) => {
    return eventStore[eventType][domElementId];
}

export const EventManager = {
    registerEvent: register,
    unregisterEvent: unregister
}
    

    
