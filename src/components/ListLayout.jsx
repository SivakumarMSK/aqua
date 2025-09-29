import React from 'react';
import Navbar from './Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import '../styles/ListLayout.css';

const ListLayout = ({ title, items, renderItem, createPath, createLabel, renderControls, pagination }) => {
  return (
    <div className="list-page-container">
      <Navbar />
      <div className="container list-page-content">
        <div className="page-header">
          <h3>{title}</h3>
          {createPath && (
            <Button variant="primary" href={createPath} className="add-button">
              <span className="plus-icon">+</span> {createLabel}
            </Button>
          )}
        </div>

        {renderControls ? (
          <div className="controls-row">
            {renderControls()}
          </div>
        ) : (
          <div className="controls-row">
            <InputGroup className="search-bar">
              <Form.Control placeholder={`Search ${title.toLowerCase()}...`} />
            </InputGroup>
            <div className="filter-sort-group">
              <Form.Select className="filter-select">
                <option>Filter by Status</option>
              </Form.Select>
              <Form.Select className="sort-select">
                <option>Sort by</option>
              </Form.Select>
            </div>
          </div>
        )}

        <div className="items-grid">
          {items.length === 0 ? (
            <div className="empty-state">
              <h4>No {title} Found</h4>
              <p>Create a new one to get started.</p>
            </div>
          ) : (
            items.map(item => renderItem(item))
          )}
        </div>

        {pagination && (
          <div className="pagination-footer d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">{pagination.totalLabel}</div>
            <div className="btn-group">
              <Button variant="outline-secondary" size="sm" onClick={pagination.onPrev} disabled={pagination.page === 1}>
                Prev
              </Button>
              <span className="mx-2 small">Page {pagination.page} of {pagination.totalPages}</span>
              <Button variant="outline-secondary" size="sm" onClick={pagination.onNext} disabled={pagination.page === pagination.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListLayout;