import _ from 'lodash'

export const findById = (collection: Array<any>, id: string) => {
    return _.find(collection, (item) => {
        return String(item.id) === String(id)
    })
}

    
