/**
 * @fileoverview Groups API
 * @description This file contains all the API calls for groups.
 */
import {FetchHandler} from '@/lib/api'
import {Group, GroupMember} from '@/lib/api/groups/types'

const API_PREFIX = 'groups'

/**
 * @description Get a group
 * @param {string | number} groupID
 * @returns {Promise<Group>}
 */
export const getGroup = async (groupID: string | number): Promise<Group> => {
    return FetchHandler.get(`${API_PREFIX}/${groupID}`)
}

/**
 * @description Get a group member
 * @param {string | number} groupID
 * @param {string} memberID
 * @returns {Promise<GroupMember>}
 */
export const getGroupMember = async (groupID: string | number, memberID: string): Promise<GroupMember> => {
    return FetchHandler.get(`${API_PREFIX}/${groupID}/members/${memberID}`)
}

/**
 * @description Join a group
 * @param {string | number} groupID
 * @returns {Promise<any>}
 */
export const joinGroup = async (groupID: string | number): Promise<any> => {
    return FetchHandler.post(`${API_PREFIX}/${groupID}/members`)
}

/**
 * @description Leave a group
 * @param {string | number} groupID
 * @returns {Promise<any>}
 */
export const leaveGroup = async (groupID: string | number): Promise<any> => {
    return FetchHandler.delete(`${API_PREFIX}/${groupID}/members/@me`)
}

/**
 * @description Kick a member from a group
 * @param {string | number} groupID
 * @param {string} memberID
 * @returns {Promise<any>}
 */
export const kickGroupMember = async (groupID: string | number, memberID: string): Promise<any> => {
    return FetchHandler.delete(`${API_PREFIX}/${groupID}/members/${memberID}`)
}

/**
 * @description Ban a member from a group
 * @param {string | number} groupID
 * @param {string} memberID
 * @returns {Promise<any>}
 */
export const banGroupMember = async (groupID: string | number, memberID: string): Promise<any> => {
    return FetchHandler.post(`${API_PREFIX}/${groupID}/members/${memberID}`, {
        body: JSON.stringify({
            ban: true,
        }),
    })
}

/**
 * @description Change a group member's role
 * @param {string | number} groupID
 * @param {string} memberID
 * @param {string} role
 * @returns {Promise<any>}
 */
export const changeGroupMemberRole = async (groupID: string | number, memberID: string, role: string): Promise<any> => {
    return FetchHandler.post(`${API_PREFIX}/${groupID}/members/${memberID}`, {
        body: JSON.stringify({
            role,
        }),
    })
}

