'use strict'

const { CREATED, SuccessResponse } = require("../core/success.response");
const AccessService = require("../services/access.service");

class AccessController {

    handlerRefreshToken = async ( req, res, next) => {
        new SuccessResponse({
            message: 'Refresh Token Success!',
            metadata: await AccessService.handlerRefreshToken( req.body.refreshToken )
        }).send(res)
    }

    logout = async ( req, res, next) => {
        new SuccessResponse({
            message: 'Logout Success!',
            metadata: await AccessService.logout( req.keyStore )
        }).send(res)
    }

    login = async ( req, res, next) => {
        new SuccessResponse({
            metadata: await AccessService.login( req.body )
        }).send(res)
    }

    signUp = async ( req, res, next) => {
        new CREATED({
            message: 'Registered OK',
            metadata: await AccessService.signUp( req.body )
        }).send(res)
    }
}
module.exports = new AccessController();
