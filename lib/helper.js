

export const getOtherMemers = (members, userId) =>
    members.find((member) => member._id.toString() !== userId.toString())
