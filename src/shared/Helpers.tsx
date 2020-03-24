import _ from 'lodash'

export const getElementByFurnitureItemId = (id: string) => {
    return document.getElementById("el-"+id)
}

export const findById = (collection: Array<any>, id: string) => {
    return _.find(collection, (item) => {
        return String(item.id) === String(id)
    })
}

    
