import { Component, OnInit } from '@angular/core';
/*5.13追加*/
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import * as moment from 'moment';

//Firebase 紙面の都合上改行しています
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase';

//定義したインターフェイスをインポートしておく
import { Post } from '../models/post';

//コメントページのインポート
import { CommentsPage } from '../comments/comments.page';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit{
  message: string; //入力されるメッセージ用
  post: Post; //Postと同じデータ構造のプロパティを指定できる
  posts: Post[]; // Post型の配列という指定もできる

  // Firebase のコレクションを扱うプロパティー
    postsCollection: AngularFirestoreCollection<Post>;

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private afStore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router,
    private modalCtrl: ModalController
  ){}

  ////////////////////////////////////////////////

  ngOnInit(){
    console.log("ngOnInit");
  }

  ngAfterViewInit() {
    console.log("ngAfterViewInit");

    //コンポーネントの初期化時に、投稿を読み込むgetPosts()を実行
    this.afStore.firestore.enableNetwork();
    this.getPosts();
  }

  ////////////////////////////////////////////////

  addPost(){

    console.log("addPost");

    //入力されたメッセージを使って、投稿データを作成
    this.post = {
      id: '',
        userName: this.afAuth.auth.currentUser.displayName,
        message: this.message,
          created: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log(this.afStore);
    console.log(this.post);

    //ここでFirestoreにデータを追加する
    this.afStore
      .collection('posts')
      .add(this.post)
      //成功したらここ
      .then(docRef => {

        console.log("success");

        //一度投稿を追加したあとに、idを更新している
        this.postsCollection.doc(docRef.id).update({
          id: docRef.id
        });
        //追加できたら入力フィールドを空にする
        this.message = '';
      })
      .catch(async error => {

        console.log("errro");

        //エラーをToastControllerで表示
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
  }

  //Firestoreから投稿データを読み込む
  getPosts(){
    //コレクションの参照をここで取得している
      this.postsCollection = this.afStore.collection('posts', ref => ref.orderBy('created', 'desc'));
      //データに変更があったらそれを受け取ってpostsに入れる
      this.postsCollection.valueChanges().subscribe(date => {
        this.posts = date;
      });
    }

    async presentPrompt(post: Post){const alert = await this.alertCtrl.create({
      header: 'メッセージ編集',
      inputs: [
        {
        name: 'message',
        type: 'text',
        placeholder: 'メッセージ'
        }
      ],
      buttons:[
        {
        text: 'キャンセル',
        role: 'cancel',
        handler: () => {
          console.log('キャンセルが選択されました');
        }
      },
      {
        text: '更新',
        handler: data => {
          //投稿を更新するメソッドを実行
          this.updatePost(post, data.message);
          }
        }
      ]
    });
    await alert.present();
  }
  //メッセージをアップデートする
  //更新されると投稿とメッセージを受け取る
      updatePost(post: Post, message: string)
      {
    //入力されたメッセージで投稿を更新
      this.postsCollection
        .doc(post.id)
        .update({
          message: message
      })
      .then(async () => {
        const toast = await this.toastCtrl.create({
          message: '投稿が更新されました',
          duration: 3000
          });
        await toast.present();
      })
      .catch(async error => {
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
    }

    //投稿を削除する
    deletePost(post: Post){
      //受け取った投稿のidを参照して削除
      this.postsCollection
        .doc(post.id)
        .delete()
        .then(async () => {
          const toast = await this.toastCtrl.create({
            message: '投稿が削除されました',
            duration: 3000
            });
          await toast.present();
        })
        .catch(async error => {
          const toast = await this.toastCtrl.create({
            message: error.toString(),
            duration: 3000
          });
          await toast.present();
        });
    }
    //↑ここまでdeletePost()です、
    //投稿日時と現在日時との差を返す
    differenceTime(time: Date): string {
      moment.locale('ja');
      return moment(time).fromNow();
    }

    //ログアウト処理
   logout(){
      this.afStore.firestore.disableNetwork();
      this.afAuth.auth
        .signOut()
        .then(async () => {
          const toast = await this.toastCtrl.create({
            message: 'ログアウトしました',
            duration: 3000
        });
        await toast.present();
        this.router.navigateByUrl('/login');
        })
        .catch(async error => {
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
    }

  async  showComment(post: Post){
    const modal = await this.modalCtrl.create({
      component: CommentsPage,
      componentProps: {
      sourcePost: post
      }
    });
    return await modal.present();
  }
}
/*    posts: { userName: string, message: string, createdDate: any}[]=
    [{userName: 'Taro Yamada', message:'これはテストメッセージです', createdDate: '10分前' },
     {userName: 'Jiro Suzuki', message:'ふたつめのテストメッセージ！', createdDate: '5分前'}
    ];

/*5.14追加*/
/*    constructor(private alertCtrl: AlertController){}
    addPost(){ //入力されたメッセージを使って、投稿データを作成
      this.post={
        userName: 'Akira Yanagihara',
        message: this.message,
        createdDate: '数秒前'
      };
      //配列postsにpostを追加する
        this.posts.push(this.post);
      //入力フィールドを空にする
        this.message= ' ';
      }


    /*5.15追加*/
/*      async presentPrompt(index: number){const alert = await this.alertCtrl.
    create({
      header: `メッセージ編集`,
      inputs:[
              {name: 'message',type:'text', placeholder:'メッセージ'}
             ],
      buttons:[{text:'キャンセル', role:'cancel', handler:() =>{
              console.log('キャンセルが選択されました')}},
               {text:'更新',handler: date =>{console.log(date);
                this.posts[index].message=date.message;}
               }
              ]
            });
          await alert.present();
        }
//5.18//
    deletePost(index: number){this.posts.splice(index, 1)}
  } */
