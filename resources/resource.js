import setupDB from "../lib/setupDB";

const resource = ({ app, path, allowedFields }) => {

  const repo = setupDB(path);

  const filterObj = (obj, allowedFields) => {
    const newObj = {};
    Object.keys(obj).map((fields) => {
      if (allowedFields.includes(fields)) newObj[fields] = obj[fields];
    });
    return newObj;
  };

  const filterBody = (req, res, next, allowedFields) => {
    req.body = filterObj(req.body, allowedFields);
    next();
  }

  const create = async (req, res) => {
    await repo.create(req.body);

    res.status(201).json({
      status: 'success',
      data: req.body,
    });
  };

  const get = async (req, res) => {
    const data = await repo.get(req.params.id)
    res.status(200).json({ status: 'success', data });
  };

  const getAll = async (req, res) => {
    const data = await repo.getAll();
    res.status(200).json({
      status: 'success',
      results: data.length,
      data,
    });
  };

  const remove = async (req, res) => {
    await repo.remove(req.params.id);

    res.status(204).json({ status: 'success', message: 'Deleted successfully.' });
  };

  const update = async (req, res) => {
    const data = req.body;
    await repo.update(req.params.id, data)

    res.status(200).json({
      status: 'success',
      data,
    });
  };

  app.get(`/${path}`, getAll);
  app.post(`/${path}`, (req, res, next) => filterBody(req, res, next, allowedFields), create);
  app
    .get(`/${path}/:id`, get)
    .put(`/${path}/:id`, (req, res, next) => filterBody(req, res, next, allowedFields), update)
    .delete(`/${path}/:id`, remove);
};

export default resource;