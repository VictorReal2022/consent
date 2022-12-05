module.exports = {
  sendProjectError: (req, res) => {
    req.flash('error', 'Invalid project');
    res.redirect('/error');
  },
  sendNoProjectError: (req, res) => {
    req.flash('error', 'You need to choose a project first');
    res.redirect('/error');
  },
  sendNotFoundError: (req, res, name) => {
    req.flash('error', `${name} not found`);
    res.redirect('/error');
  },
};
