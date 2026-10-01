"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentController = void 0;
const parent_repository_1 = require("../repositories/parent.repository");
const apiResponse_1 = require("../utils/apiResponse");
class ParentController {
    static async searchParents(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const query = req.query.q || '';
            const parents = await parent_repository_1.ParentRepository.searchParents(schoolId, query);
            return apiResponse_1.ResponseUtil.success(res, parents, 'Parents retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async getParentById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const parent = await parent_repository_1.ParentRepository.findById(id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, parent, 'Parent details retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.notFound(res, error.message);
        }
    }
}
exports.ParentController = ParentController;
//# sourceMappingURL=parent.controller.js.map