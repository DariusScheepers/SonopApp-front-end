import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { FormGroup, FormControl } from '@angular/forms';
import { Http } from '../../http-api';
import { RegisterPage } from '../user/register/register';
import { GlobalProvider } from "../../providers/global/global";
import { presentToast, handleError } from '../../app-functions';
import { appVersionToDisplay } from '../../app-config';
import { LoginNonniePage } from '../nonnie/login-nonnie/login';
import { LoginModel } from '../../../functions/src/models/login.model';
import { StudentLoginModel } from '../../../functions/src/models/student.model';
import { AppVersionModel } from '../../../functions/src/models/login.model';
import { AnnouncementsPage } from '../user/announcements/announcements';
import { functionsVersion } from '../../../functions/src/constants/environment.constant';
import { SuccessResponseModel } from '../../../functions/src/models/success-response.model';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  appVersion = appVersionToDisplay;
  backEndVersion = functionsVersion;
  appVersionIsCorrect = true;

  user: FormGroup | LoginModel;
  splashScreenReady: any = false;
  splashScreenVisibility: any = "hidden";
  splashScreenOn: any = true;
  splashScreenOnLength: any = 4500;
  constructor(public navCtrl: NavController, public toastCtrl: ToastController, public http: Http, public global: GlobalProvider) {
    this.user = new FormGroup({
      studentNumber: new FormControl()
    });

    this.verifyAppVersionUpToDate();
  }

  public verifyAppVersionUpToDate() {
    const appVersionFromFrontEnd: AppVersionModel = {
      appVersion: this.appVersion
    }

    this.http.post('/appVersion', appVersionFromFrontEnd).subscribe(data => {
      const response: SuccessResponseModel = JSON.parse(data.text());
      if (response.success) {
        presentToast(this.toastCtrl, 'App version is up to date!');
      } else {
        alert(`Please refresh your browser for an updated version!\nHint: clear cache (search history).`);
        this.appVersionIsCorrect = false;
      }
    }, (error) => {
      handleError(this.navCtrl, error, this.toastCtrl);
    });
  }

  public splashScreenLoaded() {
    this.splashScreenReady = true;
    this.splashScreenVisibility = "visible";
    setTimeout(() => {
      this.splashScreenOn = false;
    }, this.splashScreenOnLength);
  }

  public login(value: any) {
    if (value.studentNumber.length < 8) {
      presentToast(this.toastCtrl, 'Student number is too short');
      return;
    } else if (value.studentNumber.length > 8) {
      presentToast(this.toastCtrl, 'Student number is too long');
      return;
    }

    let jsonArr: LoginModel = {
      studentNumber: value.studentNumber
    };

    this.http.post("/login", jsonArr).subscribe(data => {
      let student: StudentLoginModel = JSON.parse(data.text());
      if (student.success) {
        if (student.studentInfo.verified) {
          presentToast(this.toastCtrl, "Logged in!");
          this.global.myUsrID = student.studentID;
          this.global.mySurname = student.studentInfo.surname;
          this.global.isHK = student.studentInfo.isHk;
          if (student.isBestCoder) {
            this.global.isHK = true;
          }

          this.navCtrl.setRoot(AnnouncementsPage);
        } else {
          presentToast(this.toastCtrl, "Your account has not yet been verified. Please try again later.");
        }
      }
      else {
        presentToast(this.toastCtrl, "Invalid Login. Try Again.");
      }
    }, (error) => {
      handleError(this.navCtrl, error, this.toastCtrl);
    });
  }

  public openRegister() {
    this.navCtrl.push(RegisterPage);
  }

  public goToNonnieLogin() {
    this.navCtrl.push(LoginNonniePage);
  }
}
