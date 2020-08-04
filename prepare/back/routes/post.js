const express = require('express');
const multer = require('multer');
const path = require('path');   //node 제공
const fs = require('fs')  //filesystem

const { Post, User, Comment,Image, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

/*이미지 업로드 폴더 생성*/
try{
  fs.accessSync('uploads');
}catch (error){
  console.log('uploads 폴더가 없으므로 생성합니다.');
  fs.mkdirSync('uploads');
}

/*이미지 업로드*/
const upload = multer({
  storage : multer.diskStorage({
    destination(req, file, done){
      done(null, 'uploads');
    },
    filename(req, file, done){    // 의성.png
      const ext = path.extname(file.originalname); // 확장자 추출   (.png)
      const basename = path.basename(file.originalname, ext)  //파일 이름  (의성)
      done(null, basename +'_'+ new Date().getTime() + ext);    //의성20151545.png
    },
  }),
  limits : { fileSize : 20 * 1024 * 1024 },  //20MB
});

/*게시글 작성*/
router.post('/', isLoggedIn, upload.none(), async (req,res,next) =>{
  try{
    const hashtags =  req.body.content.match(/(#[^\s#]+)/g);
    const post = await Post.create({
      content : req.body.content,
      UserId : req.user.id,
    });
    if(hashtags){
      const result = await Promise.all(hashtags.map((tag) => Hashtag.findOrCreate({
        where : {name : tag.slice(1).toLowerCase() }
      })));
      await post.addHashtags(result.map((v) => v[0]));
    }
    if(req.body.image){
      if(Array.isArray(req.body.image)){   //이미지 여러개 올리면 iamge : [제로초.png, 부기초.png] 배열형태
        const images = await Promise.all(req.body.image.map((image) => Image.create({ src : image })));
        await post.addImages(images);
      }else{                              //이미지 한개 올리면 image: 제로초.png
        const image = await Image.create({src : req.body.image});
        await post.addImages(image);
      }
    }
    const fullPost =  await Post.findOne({
      where : {id : post.id},
      include : [{
        model: Image,
      }, {
        model : Comment,
        include : [{
          model : User,                   //댓글 작성자
          attributes : ['id' , 'nickname'],

        }],
      }, {
        model : User,                    //게시글 작성자
        attributes : ['id' , 'nickname'],
      },{
          model : User,                 //좋아요 한사람
          as : 'Likers',
          attributes : ['id'],
      }]
    },)
    res.status(201).json(fullPost);
  }catch (error){
    console.log(error);
    next(error);
  }
});

// upload 속성 : array, none, single, fields
router.post('/images', isLoggedIn, upload.array('image'), async  (req, res) => {
  console.log(req.files);
  res.json(req.files.map((v) => v.filename));
});


/*댓글 작성*/
router.post('/:postId/comment', isLoggedIn, async (req,res,next) =>{
  try{
    const post = await Post.findOne({
      where : {id : req.params.postId }
    });
    if(!post){
      return res.status(403).send('존재하지 않는 게시글입니다.');
    }

    const comment = await Comment.create({
      content : req.body.content,
      PostId : parseInt(req.params.postId,10),
      UserId : req.user.id,
    });
    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [{
        model: User,
        attributes: ['id', 'nickname'],
      }],
    })
    res.status(201).json(fullComment);
  }catch (error){
    console.log(error);
    next(error);
  }
});

/*좋아요  */
router.patch('/:postId/like', isLoggedIn ,async (req,res,next) => {
  try{
    const post = await Post.findOne({ where : {id : req.params.postId } });
    if(!post){
      return res.status(401).send('게시글이 존재하지 않습니다');
    }
    await post.addLikers(req.user.id);
    res.json( { PostId : post.id, UserId : req.user.id });
  }catch(error){
    console.error(error);
    next(error);
  }
});

/*좋아요 취소*/
router.delete('/:postId/like', isLoggedIn ,async (req,res) =>{
  try{
    const post = await Post.findOne({ where : {id : req.params.postId } });
    if(!post){
      return res.status(401).send('게시글이 존재하지 않습니다');
    }
    await post.removeLikers(req.user.id);
    res.json( { PostId : post.id, UserId : req.user.id });
  }catch(error){
    console.error(error);
    next(error);
  }
});

/*게시글 삭제 */
router.delete('/:postId', isLoggedIn ,async (req,res) =>{
  try{
    await Post.destroy({
      where : {
        id :req.params.postId ,
        UserId : req.user.id,
      },
    });
    res.status(200).json({ PostId : parseInt(req.params.postId,10) });
  }catch(error){
    console.error(error);
    next(error);
  }
});

module.exports = router;