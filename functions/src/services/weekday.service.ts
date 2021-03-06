import { DataService } from "./data.service";
import { UserService } from "./user.service";
import { FirebaseDataBase } from "../database/firebase.database.service";
import { FirebaseIdentifier } from "../models/database-identifier.model";
import { UserIdentificationModel } from "../models/user-identification.model";
import { createInitialWeekdayEntry, WeekdayModel, WeekdayMealDetail, getWeekdayMeals, getWeekdayMealStatuses, WeekdayMealsModel, WeekdaySignInStatus } from "../models/weekday.model";
import { SuccessResponseModel } from "../models/success-response.model";
import { StudentModel } from "../models/student.model";

export class WeekdayService extends DataService {
    collection = 'weekday';
    weekdayDocumentSuffix = "_Weekday";
    userService: UserService;
    constructor(database: FirebaseDataBase, userService: UserService) {
        super(database);
        this.userService = userService;
        
        // this.populateWeekdayMeals();
    }

    async populateWeekdayMeals() { // private 
        const students = await this.userService.getAllStudents();
        for (const student of students) {
            await this.addWeekdayEntryForStudent(student);
        }
    }

    async addWeekdayEntryForStudent(studentSnapshot: FirebaseFirestore.DocumentSnapshot) {
        const documentID = this.getWeekdayDocumentIDFromStudentID(studentSnapshot.id);
        const searchForWeekday = new FirebaseIdentifier(this.collection, documentID);
        const weekday = await this.database.readFromDatabaseSingleItem(searchForWeekday);
        if (!weekday.exists) {
            await this.resetStudentSignIn(documentID, studentSnapshot.ref);
        }
    }

    private async resetStudentSignIn(documentID: string, studentReference: any) {
        const weekday = createInitialWeekdayEntry(studentReference);
        const studentWeekdayToInsert = new FirebaseIdentifier(this.collection, documentID, weekday);
        await this.database.writeToDatabase(studentWeekdayToInsert);
    }

    async getStudentWeekdayDetails(userID: UserIdentificationModel) {
        const student = await this.userService.getStudentDataByID(userID);
        const weekdaySignIns = student.weekdaySignIns;
        return this.provideArrayOfWeekdayMeals(weekdaySignIns);
    }

    async getOldWeekdayDoc(userID: UserIdentificationModel): Promise<WeekdayMealsModel> {
        const docID = this.getWeekdayDocumentIDFromStudentID(userID.id);
        const weekdayDataIdentifier = new FirebaseIdentifier(this.collection, docID);
        const weekdaySnapshot = await this.database.readFromDatabaseSingleItem(weekdayDataIdentifier);
        const data = weekdaySnapshot.data();
        if (data) {
            delete data.student;
        }
        return data as WeekdayMealsModel;
    }

    private getWeekdayDocumentIDFromStudentID(studentID: string) {
        return studentID + this.weekdayDocumentSuffix;
    }

    private provideArrayOfWeekdayMeals(weekdayDetail: WeekdayMealsModel): WeekdayMealDetail[] {
        const weekdayMeals: WeekdayMealDetail[] = getWeekdayMeals(weekdayDetail);
        return weekdayMeals;
    }

    async updateWeekdayForStudent(updateWeekdayDetail: WeekdayModel) {
        const weekdayDocumentID = this.getWeekdayDocumentIDFromStudentID(updateWeekdayDetail.student);
        const fieldsToUpdate = getWeekdayMealStatuses(updateWeekdayDetail);
        const weekdayUpdate = new FirebaseIdentifier(this.collection, weekdayDocumentID, fieldsToUpdate);
        await this.database.updateDatabaseItem(weekdayUpdate);
        const response: SuccessResponseModel = {
            success: true
        }
        return response;
    }

    async resetWeekdaySignOut() {
        const studentSnapshots = await this.userService.getStudentsBaseOnVerifiedOrNot(true);
        for (const studentSnapshot of studentSnapshots) {
            const student = studentSnapshot.data() as StudentModel;
            const weekdaySignIns = student.weekdaySignIns;
            weekdaySignIns.mondayLunch = weekdaySignIns.mondayLunch == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.mondayLunch;
            weekdaySignIns.mondayDinner = weekdaySignIns.mondayDinner == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.mondayDinner;
            weekdaySignIns.tuesdayLunch = weekdaySignIns.tuesdayLunch == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.tuesdayLunch;
            weekdaySignIns.tuesdayDinner = weekdaySignIns.tuesdayDinner == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.tuesdayDinner;
            weekdaySignIns.wednesdayLunch = weekdaySignIns.wednesdayLunch == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.wednesdayLunch;
            weekdaySignIns.wednesdayDinner = weekdaySignIns.wednesdayDinner == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.wednesdayDinner;
            weekdaySignIns.thursdayLunch = weekdaySignIns.thursdayLunch == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.thursdayLunch;
            weekdaySignIns.thursdayDinner = weekdaySignIns.thursdayDinner == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.thursdayDinner;
            weekdaySignIns.fridayLunch = weekdaySignIns.fridayLunch == WeekdaySignInStatus.signedOutTemporarily ? WeekdaySignInStatus.signedIn : weekdaySignIns.fridayLunch;
            const update = Object.assign(
                {student: studentSnapshot.id},
                weekdaySignIns
            );
            await this.userService.updateStudentWeekday(update);
        }
    }
}