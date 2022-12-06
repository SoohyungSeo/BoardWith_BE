const UsersRepository = require("../repositories/users");  
const PostsRepository = require("../repositories/posts");
const CommentsRepository = require("../repositories/comments");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const CHECK_PASSWORD = /^[a-zA-Z0-9]{4,30}$/; // 8~15 으로 변경
const CHECK_ID = /^[a-zA-Z0-9]{4,20}$/; // 4 ~ 15으로 변경

class UserService {
    // 새 인스턴스 생성
    usersRepository = new UsersRepository();
    postsRepository = new PostsRepository();
    commentsRepository = new CommentsRepository();

    // 회원가입 찾기위한 함수
    signUp = async (
        userId,
        nickName,
        password,
        confirm,
        phoneNumber,
        myPlace,
        age,
        gender,
        likeGame,
        admin
    ) => {
        // usersService 안에 있는 findUserAccount 함수를 이용해서 선언
        const isSameId = await this.usersRepository.findUserAccountId(userId);
        const isSameNickname = await this.usersRepository.findUserAccountNick(
            nickName
        );

        // 유저 id 중복 검사
        if (isSameId) {
            const err = new Error(`UserService Error`);
            err.status = 409;
            err.message = "이미 가입된 아이디가 존재합니다.";
            throw err;
        }

        // 유저 nickname 중복 검사
        if (isSameNickname) {
            const err = new Error(`UserService Error`);
            err.status = 409;
            err.message = "이미 가입된 닉네임이 존재합니다.";
            throw err;
        }

        //아이디가 최소 9자리 아닐 경우
        if (!CHECK_ID.test(userId)) {
            const err = new Error(`UserService Error`);
            err.status = 403;
            err.message = "아이디는 최소 4자리 이상으로 해주세요.";
            throw err;
        }

        // 비밀번호 최소치 안맞을 경우
        if (!CHECK_PASSWORD.test(password)) {
            const err = new Error(`UserService Error`);
            err.status = 403;
            err.message = "비밀번호는 최소 4자리수를 넘겨주세요";
            throw err;
        }

        // 비밀번호와 비밀번호 확인이 안맞을 경우
        if (password !== confirm) {
            const err = new Error(`UserService Error`);
            err.status = 403;
            err.message = "비밀번호와 확인 비밀번호가 일치하지 않습니다.";
            throw err;
        }
        const salt = await bcrypt.genSalt(11);
        // 반복 횟수 한번 늘려보자
        password = await bcrypt.hash(password, salt);

        // userRepository안에 있는 createAccount 함수를 이용하여 선언 (salt도 넣어야함)
        const createAccountData = await this.usersRepository.signUp(
            userId,
            nickName,
            password,
            phoneNumber,
            myPlace,
            age,
            gender,
            likeGame,
            admin
        );

        return createAccountData;
    };

    // 유저 id 중복 찾기
    findDupId = async(userId) => {
        const findDupId = await this.usersRepository.findUserAccountId(userId)

        // 유저 id 중복 검사
        if (findDupId) {
            const err = new Error(`UserService Error`);
            err.status = 409;
            err.message = "이미 가입된 아이디가 존재합니다.";
            throw err;
        } else {
            return "사용 가능한 아이디입니다."
        }

    }

        // 유저 nickname 중복 찾기
        findDupNick = async(nickName) => {
            const findDupNick = await this.usersRepository.findUserAccountNick(nickName)
    
            // 유저 nickname 중복 검사
            if (findDupNick) {
                const err = new Error(`UserService Error`);
                err.status = 409;
                err.message = "이미 가입된 닉네임이 존재합니다.";
                throw err;
            } else {
                return "사용 가능한 닉네임입니다."
            }
        }

    // 로그인 찾기위한 함수
    login = async (userId, password) => {
        // userRepository안에 있는 login 함수를 이용하여 선언
        const loginData = await this.usersRepository.login(userId);

        if (!loginData) {
            const err = new Error(`UserService Error`);
            err.status = 403;
            err.message = "아이디를 확인해주세요.";
            throw err;
        }

        const check = await bcrypt.compare(password, loginData.password);

        if (!check) {
            const err = new Error(`UserService Error`);
            err.status = 403;
            err.message = "패스워드를 확인해주세요.";
            throw err;
        }

        return { loginData };
    };

    // accessToken 생성
    accessToken = async (userId) => {
        const accessToken = jwt.sign(
            { userId: userId },
            process.env.DB_SECRET_KEY,
            {
                expiresIn: "5m",
            }
        );
        return accessToken;
    };

    // refreshToken 생성
    refreshToken = async () => {
        const refreshToken = jwt.sign({}, process.env.DB_SECRET_KEY, {
            expiresIn: "1d",
        });
        return refreshToken;
    };

    // refreshToken DB에 업뎃 업데이트 하는 함수
    updateToken = async (userId, refresh_token) => {
        // console.log(refresh_Token)
        await this.usersRepository.updateToken(userId, refresh_token);

        const findData = await this.usersRepository.findUserAccount(
            userId,
            refresh_token
        );

        return findData;
    };

    // nickname 불러오기
    getNickname = async (userId, password) => {
        const getNickname = await this.usersRepository.findUserAccount(
            userId,
            password
        );
        return getNickname;
    };

    // 회원 정보 불러오기
    findUserData = async (userId, nickName) => {
        const findUserData = await this.usersRepository.findUserData(
            userId,
            nickName
        );

        const findBookmarkData =
            await this.postsRepository.findPostsByPostIdForBookmark(
                findUserData.bookmark
            );

        const BookmarkMapData = findBookmarkData.map((postInfo) => {
            return {
                postId: postInfo._id,
                title: postInfo.title,
                closed: postInfo.closed,
            };
        });
        findUserData["bookmarkData"] = BookmarkMapData;
        return findUserData;
    };

    // 회원 정보 업데이트
    updateUserData = async (
        userId,
        nickName,
        myPlace,
        age,
        gender,
        likeGame,
        visible,
        tutorial
    ) => {
        const findUserAccountId = await this.usersRepository.findUserAccountId(
            userId
        );

        if (myPlace == "") {
            myPlace = findUserAccountId.myPlace;
        }

        if (age == "") {
            age = findUserAccountId.age;
        }

        if (gender == "") {
            gender = findUserAccountId.gender;
        }

        if (likeGame == "") {
            likeGame = findUserAccountId.likeGame;
        }

        if (visible == "") {
            visible = findUserAccountId.visible;
        }

        if (tutorial == "") {
            tutorial = findUserAccountId.tutorial;
        }

        const updateUserData = await this.usersRepository.updateUserData(
            userId,
            nickName,
            myPlace,
            age,
            gender,
            likeGame,
            visible,
            tutorial
        );

        return updateUserData;
    };

    // 회원 탈퇴
    deleteUserData = async (nickname) => {
        const deleteUserData = await this.usersRepository.deleteUserData(nickname);
        return deleteUserData;
    };

    // 참여 예약한 모임
    partyReservedData = async (nickName) => {
        const partyReservedData = await this.postsRepository.partyReservedData(
            nickName
        );
        return partyReservedData;
    };

    // 참여 확정된 모임
    partyGoData = async (nickName) => {
        const partyGoData = await this.postsRepository.partyGoData(nickName);
        return partyGoData;
    };

    // 다른 유저 정보를 보기
    lookOtherUser = async (nickName) => {
        const lookOtherUser = await this.usersRepository.lookOtherUser(nickName);
        return lookOtherUser;
    };

    // 정보 찾기 nick으로
    findUserNick = async (nickName) => {
        const findUserNick = await this.usersRepository.findUserNick(nickName);
        return findUserNick;
    }

    // 비밀번호 변경
    changePW = async (userId, password) => {
        const salt = await bcrypt.genSalt(11);
        password = await bcrypt.hash(password, salt);

        const changePW = await this.usersRepository.changePW(userId, password);
        return changePW;
    };

    loginCheck = async (userId) => {
        await this.usersRepository.loginCheck(userId);
        return;
    };

    refreshT = async (refresh_token) => {
        const refreshT = await this.usersRepository.refreshT(refresh_token);
        return refreshT;
    };

    //북마크
    pushBookmark = async (postId, nickName) => {
        const findBookmark = await this.usersRepository.findBookmark(nickName);
        if (findBookmark.bookmark.includes(postId) === false) {
            await this.usersRepository.pushBookmark(postId, nickName);
        } else if (findBookmark.bookmark.includes(postId)) {
            await this.usersRepository.pullBookmark(postId, nickName);
        }
        return findBookmark;
    };

    getBookmark = async (nickName) => {
        let result = [];
        const getBookmark = await this.usersRepository.getBookmark(nickName);
        //console.log("getBookmark", getBookmark)
        const GetBookmark = getBookmark.map((userInfo) => userInfo.bookmark);
        //console.log("GetBookmark", GetBookmark)

        for (let i = 0; i < GetBookmark.length; i++) {
            //사실상 GetBookmark.length = 1 이라 for문 불필요해보임
            const AllgetBookmark = await this.usersRepository.AllgetBookmark(
                GetBookmark[i]
            );
            //console.log("AllgetBookmark", AllgetBookmark)

            if (AllgetBookmark.length === 0) {
                const err = new Error("postsService Error");
                err.status = 200;
                err.message = "등록된 게시물이 없습니다.";
                throw err;
            } else if (AllgetBookmark.length !== 0) {
                result.push(AllgetBookmark);
            }
        }
        const mapResult = result[0].map((postInfo) => {
            return {
                postId: postInfo._id,
                title: postInfo.title,
                closed: postInfo.closed,
            };
        });
        return mapResult;
    };

    // 아바타 변경 및 포인트 차감
    subPoint = async(userId, userAvatar) => {
        const subPoint = await this.usersRepository.subPoint(userId, userAvatar);
        return subPoint;
    }
}

module.exports = UserService;
