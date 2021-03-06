import { LoginModel, AppVersionModel } from "../models/login.model";
import { DataService } from "./data.service";
import { FirebaseDataBase } from "../database/firebase.database.service";
import { FirebaseIdentifier, FirebaseIdentifierAttributeValue, QueryOperators } from "../models/database-identifier.model";
import { StudentModel, StudentLoginModel, StudentUpdateModel, StudentUpdatePasswordModel, StudentUpdateForNonnieModel, StudentRegisterModel, addNewStudent } from "../models/student.model";
import { BedieningTableService } from "./bediening-tables.service";
import { BedieningTable } from "../models/bediening-table.enum";
import { bestCodersInformation } from "../constants/best-coders.constant";
import { UserIdentificationModel } from "../models/user-identification.model";
import { SuccessResponseModel } from "../models/success-response.model";
import { WeekendModel, getWeekendMealStatuses } from "../models/weekend.model";
import { WeekdayModel, getWeekdayMealStatuses } from "../models/weekday.model";
import { appVersion } from "../constants/environment.constant";

export class UserService extends DataService {
    collection = 'users';
    bedieningTableService: BedieningTableService;
    constructor(database: FirebaseDataBase, bedieningTableService: BedieningTableService) {
        super(database);
        this.bedieningTableService = bedieningTableService;
    }

    async login(loginModel: LoginModel): Promise<any> {
        const searchForStudent: FirebaseIdentifierAttributeValue = {
            collection: this.collection,
            where: [
                {
                    attribute: 'studentNumber',
                    queryOperator: QueryOperators.equal,
                    value: loginModel.studentNumber.toString()
                }
            ],
            orderBy: []
        };
        const students = await this.database.readFromDatabaseWithProperty(searchForStudent);
        if (students.length > 0) {
            const studentSnapshot = students[0];
            const student = studentSnapshot.data() as StudentModel;
            const isBestCoder = this.isBestCoder(student);
            const returnStudent: StudentLoginModel = new StudentLoginModel(studentSnapshot.id, student, true, isBestCoder)
            return returnStudent;
        } else {
            const response: SuccessResponseModel = {
                success: false
            }
            return response;
        }
    }

    async register(studentRegisterModel: StudentRegisterModel): Promise<SuccessResponseModel> {
        const newStudent: StudentModel = addNewStudent(studentRegisterModel)
        const newStudentToWrite = new FirebaseIdentifier(this.collection, newStudent.studentNumber.toString(), newStudent, true);
        await this.database.writeToDatabase(newStudentToWrite);
        const response: SuccessResponseModel = {
            success: true
        }
        return response;
    }

    private isBestCoder(studentModel: StudentModel): boolean {
        const bestCodersStudentNumbers: string[] = [];
        for (const bestCoder of bestCodersInformation) {
            bestCodersStudentNumbers.push(bestCoder.studentNumber)
        }
        return bestCodersStudentNumbers.includes(studentModel.studentNumber);    
    }

    async getStudentByID(studentID: string): Promise<FirebaseFirestore.DocumentSnapshot> {        
        const getStudentDoc = new FirebaseIdentifier(this.collection, studentID);
        return await this.database.readFromDatabaseSingleItem(getStudentDoc);
    }

    async getStudentReference(studentID: string): Promise<FirebaseFirestore.DocumentReference> {
        const snapshot = await this.getStudentByID(studentID);
        return snapshot.ref;
    }

    async getStudentValueFromReference(reference: FirebaseFirestore.DocumentReference): Promise<StudentModel> {
        const student = await this.database.readDataWithReference(reference);
        return student.data() as StudentModel;
    }

    async getStudentDataByID(userID: UserIdentificationModel): Promise<StudentModel> {
        const snapshot = await this.getStudentByID(userID.id);
        const student = snapshot.data() as StudentModel;
        
        return student;
    }

    async updateStudentInformation(studentUpdateInfo: StudentUpdateModel) {
        const updateStudent = new FirebaseIdentifier(this.collection, studentUpdateInfo.studentID, studentUpdateInfo);
        await this.database.updateDatabaseItem(updateStudent);
    }

    async updateStudentPassword(studentUpdatePassword: StudentUpdatePasswordModel) {
        const searchForStudent = new FirebaseIdentifier(this.collection, studentUpdatePassword.studentID);
        const snapshot = await this.database.readFromDatabaseSingleItem(searchForStudent);
        const student = snapshot.data() as StudentModel;
        let response: SuccessResponseModel = {
            success: false
        }
        if (student.password != studentUpdatePassword.oldPassword) {
            return response;
        }
        
        const updateStudent = new FirebaseIdentifier(this.collection, studentUpdatePassword.studentID, {password: studentUpdatePassword.newPassword});
        await this.database.updateDatabaseItem(updateStudent);
        response.success = true;
        return response;        
    }

    async updateStudentWeekend(weekendMeals: WeekendModel) {
        const fieldsToUpdate = getWeekendMealStatuses(weekendMeals);
        const updateStudentWeekendMeals = new FirebaseIdentifier(this.collection, weekendMeals.student, {weekendSignIns: fieldsToUpdate});
        await this.database.updateDatabaseItem(updateStudentWeekendMeals);
        const response: SuccessResponseModel = {
            success: true
        }
        return response;
    }

    async updateStudentWeekday(weekdayMeals: WeekdayModel) {
        const fieldsToUpdate = getWeekdayMealStatuses(weekdayMeals);
        const updateStudentWeekendMeals = new FirebaseIdentifier(this.collection, weekdayMeals.student, {weekdaySignIns: fieldsToUpdate});
        await this.database.updateDatabaseItem(updateStudentWeekendMeals);
        const response: SuccessResponseModel = {
            success: true
        }
        return response;
    }

    async getAllStudents() {
        const getAllStudents = new FirebaseIdentifier(this.collection);
        const allStudents = await this.database.readFromDatabaseMultipleItems(getAllStudents);
        return allStudents
    }

    async verifyAccount(studentID: UserIdentificationModel): Promise<SuccessResponseModel> {
        const verified = {
            verified: true
        };
        const toVerifyAccount = new FirebaseIdentifier(this.collection, studentID.id, verified);
        await this.database.updateDatabaseItem(toVerifyAccount);
        const response: SuccessResponseModel = {
            success: true
        }
        return response;
    }

    async deleteStudent(studentID: UserIdentificationModel): Promise<SuccessResponseModel> {
        const deleteStudent = new FirebaseIdentifier(this.collection, studentID.id);
        await this.database.deleteItem(deleteStudent);
        const response: SuccessResponseModel = {
            success: true
        }
        return response;
    }

    async updateInformationForNonnie(accountInformation: StudentUpdateForNonnieModel) {
        const updateInformation = new FirebaseIdentifier(this.collection, accountInformation.studentID, accountInformation);
        await this.database.updateDatabaseItem(updateInformation);
        const response: SuccessResponseModel = {
            success: true
        }
        return response;
    }

    async deleteAllUsers() {
        const toDeleteAllUsers = new FirebaseIdentifier(this.collection);
        await this.database.deleteTable(toDeleteAllUsers);
    }

    async getAllUsersAccordingToBedieningTable(bedieningTable: BedieningTable): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
        const searchForStudent: FirebaseIdentifierAttributeValue = {
            collection: this.collection,
            where: [
                {
                    attribute: 'bedieningTable',
                    queryOperator: QueryOperators.equal,
                    value: bedieningTable
                },
                {
                    attribute: 'verified',
                    queryOperator: QueryOperators.equal,
                    value: true
                }
            ],
            orderBy: []
        };
        const studentsSnapshots = await this.database.readFromDatabaseWithProperty(searchForStudent);
        return studentsSnapshots;
    }

    async getStudentsBaseOnVerifiedOrNot(verified: boolean) {
        const searchForStudent: FirebaseIdentifierAttributeValue = {
            collection: this.collection,
            where: [
                {
                    attribute: 'verified',
                    queryOperator: QueryOperators.equal,
                    value: verified
                }
            ],
            orderBy: []
        };
        const studentsSnapshots = await this.database.readFromDatabaseWithProperty(searchForStudent);
        return studentsSnapshots;
    }

    verifyAppVersion(appVersionFromFrontEnd: AppVersionModel): SuccessResponseModel {
        return {
            success: appVersionFromFrontEnd.appVersion == appVersion
        };
    }
}
