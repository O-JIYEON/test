import { useEffect, useState } from 'react';
import {
  fetchCustomers,
  fetchCustomerContacts,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact
} from '../../api/customers.api';
import ConfirmDialog from '../../components/dialogs/ConfirmDialog';
import '../../components/dialogs/modal.css';
import Toast from '../../components/feedback/Toast';
import Loading from '../../components/feedback/Loading';
import Pagination from '../../components/common/pagination';
import IconButton from '../../components/common/IconButton';
import CustomerModal from './components/CustomerModal';
import ContactModal from './components/ContactModal';
import penLineIcon from '../../assets/icon/penLine.svg';
import trashIcon from '../../assets/icon/trash.svg';
import { formatKstDate, formatKstDateTime } from '../../utils/date';
import './customers.css';

const customerFields = [
  { name: 'company', label: '회사명', type: 'text' },
  { name: 'business_registration_number', label: '사업자 등록증번호', type: 'text' }
];

const customerColumns = [
  { key: 'id', label: 'id' },
  { key: 'company', label: '회사명' },
  { key: 'business_registration_number', label: '사업자 등록증번호' },
  { key: 'contact_count', label: '담당자' },
  { key: 'created_at', label: '생성일' },
  { key: 'edit', label: '수정' },
  { key: 'updated_at', label: '수정일', hidden: true }
];

const contactFields = [
  { name: 'name', label: '담당자', type: 'text' },
  { name: 'contact', label: '연락처', type: 'text' },
  { name: 'email', label: '이메일', type: 'text' }
];

const contactColumns = [
  { key: 'id', label: 'id' },
  { key: 'name', label: '담당자' },
  { key: 'contact', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'created_at', label: '생성일' },
  { key: 'delete', label: '삭제' },
  { key: 'updated_at', label: '수정일', hidden: true }
];

const formatDate = (value) => formatKstDateTime(value);
const formatDateOnly = (value) => formatKstDate(value);

function CustomersPage() {
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactsStatus, setContactsStatus] = useState('idle');
  const [contactFormData, setContactFormData] = useState({});
  const [contactEditingId, setContactEditingId] = useState(null);
  const [contactFormStatus, setContactFormStatus] = useState('');
  const [contactErrorMessage, setContactErrorMessage] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [formStatus, setFormStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('');
  const [page, setPage] = useState(1);
  const [contactPage, setContactPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null
  });
  const pageSize = 10;

  const loadItems = async () => {
    try {
      setStatus('loading');
      const data = await fetchCustomers();
      const nextItems = data.customers || [];
      setItems(nextItems);
      setStatus('ready');
      setPage(1);
      if (nextItems.length > 0) {
        setSelectedCustomerId((prev) => prev ?? nextItems[0].id);
      } else {
        setSelectedCustomerId(null);
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      showToast('데이터를 불러오지 못했습니다.', 'error');
    }
  };

  const loadContacts = async (customerId) => {
    if (!customerId) {
      setContacts([]);
      setContactsStatus('idle');
      setSelectedContactId(null);
      return;
    }
    try {
      setContactsStatus('loading');
      const data = await fetchCustomerContacts(customerId);
      const nextContacts = data.contacts || [];
      setContacts(nextContacts);
      setContactsStatus('ready');
      setContactPage(1);
      setSelectedContactId(nextContacts[0]?.id ?? null);
    } catch (error) {
      console.error(error);
      setContactsStatus('error');
      showToast('데이터를 불러오지 못했습니다.', 'error');
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    loadContacts(selectedCustomerId);
  }, [selectedCustomerId]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({});
    setFormStatus('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setSelectedCustomerId(item.id);
    const nextData = customerFields.reduce((acc, field) => {
      acc[field.name] = item[field.name] ?? (field.type === 'select' ? field.options[0] : '');
      return acc;
    }, {});
    setFormData(nextData);
    setFormStatus('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openCreateContactModal = () => {
    if (!selectedCustomerId) {
      return;
    }
    setContactEditingId(null);
    const nextData = contactFields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {});
    setContactFormData({ ...nextData, customer_id: selectedCustomerId });
    setContactFormStatus('');
    setContactErrorMessage('');
    setIsContactModalOpen(true);
  };

  const openEditContactModal = (contact) => {
    setContactEditingId(contact.id);
    const nextData = contactFields.reduce((acc, field) => {
      acc[field.name] = contact[field.name] ?? '';
      return acc;
    }, {});
    setContactFormData({ ...nextData, customer_id: contact.customer_id });
    setContactFormStatus('');
    setContactErrorMessage('');
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field, value) => {
    setContactFormData((prev) => ({ ...prev, [field]: value }));
  };

  const showToast = (message, variant = '') => {
    setToastMessage(message);
    setToastVariant(variant);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
      setToastVariant('');
    }, 1500);
  };

  const submitItem = async () => {
    setFormStatus('saving');
    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
      } else {
        await createCustomer(formData);
      }
      await loadItems();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
      setErrorMessage('');
      showToast(editingId ? '고객사가 수정되었습니다.' : '고객사가 등록되었습니다.');
    } catch (error) {
      console.error(error);
      if (error.status === 409) {
        showToast('등록된 사업자번호가 있습니다.', 'error');
        setFormStatus('error');
        return;
      }
      setFormStatus('error');
      setErrorMessage('저장에 실패했습니다.');
      showToast('저장에 실패했습니다.', 'error');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: editingId ? '고객사 정보를 수정하시겠습니까?' : '고객사 정보를 등록하시겠습니까?',
      onConfirm: () => {
        submitItem();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteItem = async (item) => {
    try {
      await deleteCustomer(item.id);
      await loadItems();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      setFormStatus('');
      setErrorMessage('');
      showToast('고객사가 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      setErrorMessage('삭제에 실패했습니다.');
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleDelete = () => {
    if (!editingId) {
      return;
    }
    setConfirmState({
      open: true,
      message: '고객사 정보를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteItem({ id: editingId });
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const submitContact = async () => {
    if (!selectedCustomerId) {
      setContactFormStatus('error');
      setContactErrorMessage('고객사를 선택해 주세요.');
      return;
    }
    setContactFormStatus('saving');
    try {
      const payload = { ...contactFormData, customer_id: selectedCustomerId };
      if (contactEditingId) {
        await updateCustomerContact(contactEditingId, payload);
      } else {
        await createCustomerContact(payload);
      }
      await loadContacts(selectedCustomerId);
      await loadItems();
      setIsContactModalOpen(false);
      setContactEditingId(null);
      setContactFormData({});
      setContactFormStatus('');
      setContactErrorMessage('');
      showToast(contactEditingId ? '담당자가 수정되었습니다.' : '담당자가 등록되었습니다.');
    } catch (error) {
      console.error(error);
      setContactFormStatus('error');
      setContactErrorMessage('저장에 실패했습니다.');
      showToast('저장에 실패했습니다.', 'error');
    }
  };

  const handleContactSubmit = (event) => {
    event.preventDefault();
    setConfirmState({
      open: true,
      message: contactEditingId ? '담당자 정보를 수정하시겠습니까?' : '담당자를 등록하시겠습니까?',
      onConfirm: () => {
        submitContact();
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const deleteContact = async (idOverride) => {
    try {
      const targetId = idOverride ?? contactEditingId;
      if (!targetId) {
        return;
      }
      await deleteCustomerContact(targetId);
      await loadContacts(selectedCustomerId);
      await loadItems();
      setIsContactModalOpen(false);
      setContactEditingId(null);
      setSelectedContactId(null);
      setContactFormData({});
      setContactFormStatus('');
      setContactErrorMessage('');
      showToast('담당자가 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      setContactErrorMessage('삭제에 실패했습니다.');
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleContactDelete = (idOverride) => {
    const targetId = idOverride ?? contactEditingId;
    if (!targetId) {
      return;
    }
    setConfirmState({
      open: true,
      message: '담당자 정보를 삭제하시겠습니까?',
      onConfirm: () => {
        deleteContact(targetId);
        setConfirmState({ open: false, message: '', onConfirm: null });
      }
    });
  };

  const handleConfirmCancel = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  const filteredCustomers = items.filter((item) => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    const company = String(item.company ?? '').toLowerCase();
    const businessNumber = String(item.business_registration_number ?? '').toLowerCase();
    return company.includes(query) || businessNumber.includes(query);
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const visibleItems = filteredCustomers.slice(pageStart, pageStart + pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const filteredContacts = contacts.filter((item) => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    const name = String(item.name ?? '').toLowerCase();
    return name.includes(query);
  });

  const contactTotalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const clampedContactPage = Math.min(contactPage, contactTotalPages);
  const contactStart = (clampedContactPage - 1) * pageSize;
  const visibleContacts = filteredContacts.slice(contactStart, contactStart + pageSize);
  const contactPages = Array.from({ length: contactTotalPages }, (_, index) => index + 1);

  const selectedCustomer = items.find((item) => item.id === selectedCustomerId);
  const selectedContact = contacts.find((item) => item.id === selectedContactId);

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>고객사</h2>
        </div>
      </header>
      <section className="content__section content__section--split">
        <div className="content__split-column">
          <div className="content__section-title-row">
            <h3 className="content__section-title">고객사 목록</h3>
            <span className="content__section-meta">{items.length}개사</span>
          </div>
          <div className="content__card content__card--wide">
            <div className="content__card-header content__card-header--between">
              <form className="project-form filter-form" onSubmit={(event) => event.preventDefault()}>
                <div className="filter-form__fields">
                  <label className="project-form__field filter-form__field--wide filter-form__field--compact contact-search--wide" htmlFor="customer-search">
                    <input
                      id="customer-search"
                      name="customer-search"
                      type="text"
                      placeholder=" "
                      value={customerSearch}
                      onChange={(event) => {
                        setCustomerSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                    <span>검색 (회사명, 사업자등록번호)</span>
                  </label>
                </div>
              </form>
              <button className="project-form__submit project-form__submit--compact" type="button" onClick={openCreateModal}>
                등록
              </button>
            </div>
          {status === 'loading' && <Loading />}
          {status === 'error' && null}
          {status === 'ready' && filteredCustomers.length === 0 && (
            <p className="table__status">데이터가 없습니다.</p>
          )}
          {status === 'ready' && filteredCustomers.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {customerColumns
                      .filter((column) => !column.hidden)
                      .map((column) => {
                        const headerClassName =
                          column.key === 'created_at' ? 'customer-table__hide' : '';
                        return (
                          <th key={column.key} className={headerClassName}>
                            {column.label}
                          </th>
                        );
                      })}
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`data-table__row${item.id === selectedCustomerId ? ' data-table__row--active' : ''}`}
                      onClick={() => setSelectedCustomerId(item.id)}
                    >
                      {customerColumns
                        .filter((column) => !column.hidden)
                        .map((column) => {
                          const cellClassName = column.key === 'created_at' ? 'customer-table__hide' : '';
                          if (column.key === 'created_at' || column.key === 'updated_at') {
                            return (
                              <td key={column.key} className={cellClassName}>
                                {formatDateOnly(item[column.key])}
                              </td>
                            );
                          }
                          if (column.key === 'edit') {
                            return (
                              <td key={column.key}>
                                <IconButton
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditModal(item);
                                  }}
                                  aria-label="고객사 수정"
                                >
                                  <img src={penLineIcon} alt="" aria-hidden="true" />
                                </IconButton>
                              </td>
                            );
                          }
                          return <td key={column.key}>{item[column.key] ?? ''}</td>;
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {status === 'ready' && filteredCustomers.length > 0 && (
            <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} variant="icon" />
          )}
          </div>
        </div>
        <div className="content__split-column">
          <div className="content__section-title-row">
            <h3 className="content__section-title">담당자 목록</h3>
            <span className="content__section-meta">
              {selectedCustomer?.company ?? '없음'}
            </span>
          </div>
          <div className="content__card content__card--wide">
            <div className="content__card-header content__card-header--between">
              <form className="project-form filter-form" onSubmit={(event) => event.preventDefault()}>
                <div className="filter-form__fields">
                  <label className="project-form__field filter-form__field--wide filter-form__field--compact contact-search--wide" htmlFor="contact-search">
                    <input
                      id="contact-search"
                      name="contact-search"
                      type="text"
                      placeholder=" "
                      value={contactSearch}
                      onChange={(event) => {
                        setContactSearch(event.target.value);
                        setContactPage(1);
                      }}
                      disabled={!selectedCustomerId}
                    />
                    <span>검색 (담당자명)</span>
                  </label>
                </div>
              </form>
              <button
                className="project-form__submit project-form__submit--compact"
                type="button"
                onClick={openCreateContactModal}
                disabled={!selectedCustomerId}
              >
                등록
              </button>
            </div>
          {!selectedCustomerId && <p className="table__status">고객사를 선택해 주세요.</p>}
          {selectedCustomerId && contactsStatus === 'loading' && <Loading />}
          {selectedCustomerId && contactsStatus === 'error' && null}
          {selectedCustomerId && contactsStatus === 'ready' && filteredContacts.length === 0 && (
            <p className="table__status">데이터가 없습니다.</p>
          )}
          {selectedCustomerId && contactsStatus === 'ready' && filteredContacts.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {contactColumns
                      .filter((column) => !column.hidden)
                      .map((column) => {
                        const headerClassName =
                          column.key === 'created_at' ? 'customer-table__hide' : '';
                        return (
                          <th key={column.key} className={headerClassName}>
                            {column.label}
                          </th>
                        );
                      })}
                  </tr>
                </thead>
                <tbody>
                  {visibleContacts.map((item) => (
                    <tr
                      key={item.id}
                      className={`data-table__row${item.id === selectedContactId ? ' data-table__row--active' : ''}`}
                      onClick={() => openEditContactModal(item)}
                    >
                      {contactColumns
                        .filter((column) => !column.hidden)
                        .map((column) => {
                          const cellClassName =
                            column.key === 'created_at' ? 'customer-table__hide' : '';
                          if (column.key === 'created_at' || column.key === 'updated_at') {
                            return (
                              <td key={column.key} className={cellClassName}>
                                {formatDateOnly(item[column.key])}
                              </td>
                            );
                          }
                          if (column.key === 'delete') {
                            return (
                              <td key={column.key} className={cellClassName}>
                                <IconButton
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleContactDelete(item.id);
                                  }}
                                  aria-label="담당자 삭제"
                                >
                                  <img src={trashIcon} alt="" aria-hidden="true" />
                                </IconButton>
                              </td>
                            );
                          }
                          return (
                            <td key={column.key} className={cellClassName}>
                              {item[column.key] ?? ''}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedCustomerId && contactsStatus === 'ready' && filteredContacts.length > 0 && (
            <Pagination
              page={clampedContactPage}
              totalPages={contactTotalPages}
              onChange={setContactPage}
              variant="icon"
            />
          )}
          </div>
        </div>
      </section>
      <CustomerModal
        isOpen={isModalOpen}
        editingId={editingId}
        customerFields={customerFields}
        formData={formData}
        formStatus={formStatus}
        errorMessage={errorMessage}
        closeModal={closeModal}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        handleDelete={handleDelete}
      />
      <ContactModal
        isOpen={isContactModalOpen}
        contactEditingId={contactEditingId}
        contactFields={contactFields}
        contactFormData={contactFormData}
        contactFormStatus={contactFormStatus}
        contactErrorMessage={contactErrorMessage}
        closeModal={closeContactModal}
        handleSubmit={handleContactSubmit}
        handleChange={handleContactChange}
        handleDelete={handleContactDelete}
      />
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || handleConfirmCancel}
        onCancel={handleConfirmCancel}
      />
      <Toast message={toastMessage} variant={toastVariant} />
    </>
  );
}

export default CustomersPage;
