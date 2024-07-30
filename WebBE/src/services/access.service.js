'use strict'

const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const KeyTokenService = require('./keyToken.service');
const { createTokenPair, verifyJWT } = require('../auth/authUtils');
const { getInfoData } = require('../utils');
const { BadRequestError, AuthFailureError, ForbiddenError } = require('../core/error.response');
const { findByEmail } = require('./user.service');

const RoleUser = {
    READ: 'READ',
    WRITE: 'WRITE',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN',
}

class AccessService {

    //Check this token used ?
    static handlerRefreshToken = async ( refreshToken ) => {
        //Check found token
        const foundToken = await KeyTokenService.findByRefreshTokenUsed( refreshToken )
        //if OK
        if(foundToken){
            //Decode Token
            const { userId, email } = await verifyJWT( refreshToken, foundToken.privateKey )
            console.log({ userId, email})
            await KeyTokenService.deleteKeyById( userId)
            throw new ForbiddenError('Something wrong happened, please re-login!')
        }

        //if NO
        const holderToken = await KeyTokenService.findByRefreshToken( refreshToken )
        if(!holderToken) throw new AuthFailureError('User not registered!')

        //Verify token
        const { userId, email } = await verifyJWT( refreshToken, holderToken.privateKey )
        console.log(`2::`,{ userId, email })

        //Check userId
        const foundUser = await findByEmail({ email})
        if(!foundUser) throw new AuthFailureError('User not registered!')

        //Create token fair
        const tokens = await createTokenPair({userId, email}, holderToken.publicKey, holderToken.privateKey)
        
        //Update token
        await holderToken.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken // Token used
            }
        })
        return {
            user: { userId, email },
            tokens
        }
    }

    //Delete key
    static logout = async ( keyStore ) => {
        const delKey = await KeyTokenService.removeKeyById( keyStore._id )
        return delKey
    }

    /*
    login
    1. check email in dbs
    2. match password
    3. create AccessToken, RefreshToken and save
    4. generate tokens
    5. get data return login 
    */
    static login = async ({ email, password, refreshToken = null}) => {
        //1.
        const foundUser = await findByEmail({ email })
        if(!foundUser) throw new BadRequestError('Tài khoản chưa đăng ký')
        //2.
        const match = await bcrypt.compare( password, foundUser.password )
        if(!match) throw new AuthFailureError('Sai mật khẩu')
        //3.
        const publicKey = crypto.randomBytes(64).toString()
        const privateKey = crypto.randomBytes(64).toString()
        //4.
        const { _id: userId} = foundUser
        const tokens = await createTokenPair({ userId, email }, publicKey, privateKey)
        await KeyTokenService.createKeyToken({
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
            userId
        })
        return {
            user: getInfoData({ fields: ['_id', 'name', 'email'], obj: foundUser}),
            tokens
            
        }
        
    }

    static signUp = async ({ name, email, password}) => {
            const holderUser = await userModel.findOne({ email}).lean();
            if( holderUser){
                throw new BadRequestError('Tài khoản gmail đã đăng ký')
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = await userModel.create({
                name, email, password: passwordHash, roles: [RoleUser.ADMIN]
            });
            
            if(newUser){
                const publicKey = crypto.randomBytes(64).toString();
                const privateKey = crypto.randomBytes(64).toString();
                const keyStore = await KeyTokenService.createKeyToken({
                    userId: newUser._id,
                    publicKey,
                    privateKey
                })
                if( !keyStore){
                    return {
                        code: 'xxxx',
                        message: 'KeyStore Error'
                    }
                } 
                const tokens = await createTokenPair({userId: newUser._id, email}, publicKey, privateKey)
            return {
                code: 201,
                metadata: {
                    user: getInfoData({ fields: ['_id', 'name', 'email'], obj: newUser}),
                    tokens
                }
            }
        }
        return {
            code: 200,
            metadata: null
        }
            
    }
}

module.exports = AccessService;