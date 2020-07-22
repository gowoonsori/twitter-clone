import React from 'react';
import AppLayout from "../componets/AppLayout";
import Head from "next/head";
import FollowList from "../componets/FollowList";
import NicknameEditForm from "../componets/NicknameEditForm";
import {useSelector} from "react-redux";

const Profile = () => {
 const {me} = useSelector((state) => state.user);

    return (
      <>
          <Head>
              <meta charSet="utf-8"/>
              <title>내 프로필 | Node bird</title>
          </Head>
          <AppLayout>
            <NicknameEditForm />
            <FollowList header = "팔로잉 목록" data ={me.Followings}/>
            <FollowList header = "팔로워 목록" data ={me.Followers}/>
          </AppLayout>
      </>
    )
}

export default Profile;