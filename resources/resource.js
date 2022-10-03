import lowdbRepo from "../lib/lowdbRepo";
import sqliteRepo from "../lib/sqliteRepo";
import { select, equals } from "@laufire/utils/collection";

const sendResponse = (res, statusCode, message = "", data = []) => {
  const setStatus = (statusCode) => {
    if (statusCode >= 400 && statusCode <= 499) return "fail"
    if (statusCode >= 500 && statusCode <= 599) return "error"
    return "success"
  }
  res.status(statusCode).json({
    status: setStatus(statusCode),
    message,
    data,
  });
}

const notFoundResponse = (res) => sendResponse(res, 404, 'Not Found.');

const filterBody = (req, res, next, schema) => {
  req.body = select(req.body, Object.keys(schema));
  next();
};

const create = async (req, res, repo) => {
  const data = req.body;

  const createdData = await repo.create(data);
  sendResponse(res, 201, "Created Successfully.", createdData)
};

const get = async (req, res, repo) => {
  const data = await repo.get(req.params.id);
  (data && !equals(data, [])) ? sendResponse(res, 200, "", data) : notFoundResponse(res);
};

const getAll = async (req, res, repo) => {
  const data = await repo.getAll();
  sendResponse(res, 200, "", { results: data.length, data })
};

const remove = async (req, res, repo) => {
  const id = req.params.id;
  const getData = await repo.get(id);
  const removeAndSendResponse = async (res, repo, id) => {
    await repo.remove(id);
    sendResponse(res, 204, 'Deleted successfully.')
  };

  (getData && !equals(getData, [])) ? removeAndSendResponse(res, repo, id) : notFoundResponse(res);
};

const update = async (req, res, repo) => {
  const id = req.params.id;
  const data = req.body;
  const getData = await repo.get(id);
  const updateAndSendResponse = async (res, repo, id) => {
    const updatedData = await repo.update(id, data);
    sendResponse(res, 200, 'Updated successfully', updatedData)
  };

  (getData && !equals(getData, [])) ? updateAndSendResponse(res, repo, id) : notFoundResponse(res);
};

const chooseRepo = {
  lowdb: (name, schema) => lowdbRepo(name),
  sqlite: (name, schema) => sqliteRepo(name, { uuid: String, ...schema }),
}

const resource = ({ app, name, schema, repoName }) => {
  const repo = chooseRepo[repoName](name, schema)

  app.get(`/${name}`, (req, res) => getAll(req, res, repo));
  app.post(
    `/${name}`,
    (req, res, next) => filterBody(req, res, next, schema),
    (req, res) => create(req, res, repo)
  );
  app
    .get(`/${name}/:id`, (req, res) => get(req, res, repo))
    .put(
      `/${name}/:id`,
      (req, res, next) => filterBody(req, res, next, schema),
      (req, res) => update(req, res, repo))
    .delete(`/${name}/:id`, (req, res) => remove(req, res, repo));

};

export default resource;