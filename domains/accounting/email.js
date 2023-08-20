module.exports = {
    sendUserEmail: async (user) => {
        console.log(`sent user email to address '${user.email}' about his current balance: ${user.balance}`);

        return {
            status: 'ok'
        }
    }
}