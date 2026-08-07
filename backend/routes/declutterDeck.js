const express = require('express');
const { validateObjectIdParam } = require('../utils/validateObjectIdParam');
const {
  getDeclutterDeckApi,
  getDeclutterHistoryApi,
  postDeclutterCandidateApi,
  deleteDeclutterCandidateByItemApi,
  postDeclutterCandidateVoteApi,
  postDeclutterCandidateReopenApi,
  postDeclutterCandidateResetVoteApi,
  postDeclutterResetAllVotesApi,
  getDeclutterActionResourcesApi,
  postDeclutterActionRerouteApi,
  postDeclutterActionRestoreKeepApi,
  postDeclutterActionReopenApi,
  postDeclutterActionCompleteApi,
} = require('../controllers/declutterDeckController');

const router = express.Router();

router.get('/', getDeclutterDeckApi);
router.get('/history', getDeclutterHistoryApi);
router.delete('/votes/mine', postDeclutterResetAllVotesApi);
router.post('/candidates', postDeclutterCandidateApi);
router.delete('/candidates/by-item/:itemId', validateObjectIdParam('itemId'), deleteDeclutterCandidateByItemApi);
router.post('/candidates/:candidateId/votes', validateObjectIdParam('candidateId'), postDeclutterCandidateVoteApi);
router.delete('/candidates/:candidateId/votes/mine', validateObjectIdParam('candidateId'), postDeclutterCandidateResetVoteApi);
router.post('/candidates/:candidateId/reopen', validateObjectIdParam('candidateId'), postDeclutterCandidateReopenApi);
router.get('/actions/resources', getDeclutterActionResourcesApi);
router.post('/actions/:candidateId/reroute', validateObjectIdParam('candidateId'), postDeclutterActionRerouteApi);
router.post('/actions/:candidateId/restore-keep', validateObjectIdParam('candidateId'), postDeclutterActionRestoreKeepApi);
router.post('/actions/:candidateId/reopen', validateObjectIdParam('candidateId'), postDeclutterActionReopenApi);
router.post('/actions/:candidateId/complete', validateObjectIdParam('candidateId'), postDeclutterActionCompleteApi);

module.exports = router;
