import React from 'react';
import {useSelector} from 'react-redux';
import Head from 'next/head';
import {END} from 'redux-saga';

import AppLayout from '../components/AppLayout';
import wrapper from '../store/configureStore';
import {LOAD_USER_REQUEST} from '../reducers/user';

import {Avatar, Card} from 'antd';
const About = () => {
  const {userInfo} = useSelector((state) => state.user);

  return (
    <AppLayout>
      <Head>
        <title>ZeroCho | NodeBird</title>
      </Head>
      {userInfo ? (
        <Card
          actions={[
            <div key="twit">
              짹짹
              <br />
              {userInfo.Posts.length}
            </div>,
            <div key="following">
              팔로잉
              <br />
              {userInfo.Followings.length}
            </div>,
            <div key="follower">
              팔로워
              <br />
              {userInfo.Followers.length}
            </div>,
          ]}
        >
          <Card.Meta
            avatar={<Avatar>{userInfo.nickname[0]}</Avatar>}
            title={userInfo.nickname}
            description="노드버드 매니아"
          />
        </Card>
      ) : null}
    </AppLayout>
  );
};

//언제 접속해도 데이터가 바뀔일이 없을때 (ex 블로그 게시글같은)
export const getStaticProps = wrapper.getStaticProps(async (context) => {
  console.log('getStaticProps');
  context.store.dispatch({
    type: LOAD_USER_REQUEST,
    data: 2,
  });
  context.store.dispatch(END);
  await context.store.sagaTask.toPromise();
});

export default About;
