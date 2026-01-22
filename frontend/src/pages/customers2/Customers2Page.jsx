import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

const API_BASE = `http://${window.location.hostname}:5001`;

dayjs.extend(utc);
dayjs.extend(timezone);

const formatDateOnly = (value) => {
  if (!value) {
    return '';
  }
  return dayjs.utc(value).tz('Asia/Seoul').format('YYYY-MM-DD');
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }
  return dayjs.utc(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm');
};

function Customers2Page() {
  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToastMessage('');
    }, 1500);
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/customers`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customers');
      }
      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);
      showToast('고객사 데이터를 불러오지 못했습니다.');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/customer-contacts`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contacts');
      }
      setContacts(data.contacts || []);
    } catch (error) {
      console.error(error);
      showToast('담당자 데이터를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    loadCustomers();
    loadContacts();
  }, []);

  const contactsByCustomer = useMemo(() => {
    return contacts.reduce((acc, contact) => {
      if (!acc[contact.customer_id]) {
        acc[contact.customer_id] = [];
      }
      acc[contact.customer_id].push(contact);
      return acc;
    }, {});
  }, [contacts]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      <header className="content__header">
        <div className="content__header-row">
          <h2>고객사2</h2>
        </div>
      </header>
      <section className="content__section content__section--single">
        <div className="content__card content__card--wide">
          {customers.length === 0 && <p className="table__status">데이터가 없습니다.</p>}
          {customers.length > 0 && (
            <div className="table__wrapper">
              <table className="data-table customer-expand-table">
                <thead>
                  <tr>
                    <th>id</th>
                    <th>회사명</th>
                    <th>사업자 등록증번호</th>
                    <th>담당자 수</th>
                    <th>등록일시</th>
                    <th>수정</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const isOpen = expandedIds.has(customer.id);
                    const items = contactsByCustomer[customer.id] || [];
                    return (
                      <>
                        <tr
                          key={customer.id}
                          className={`data-table__row customer-expand__row${isOpen ? ' is-open' : ''}`}
                          onClick={() => toggleExpanded(customer.id)}
                        >
                          <td>{customer.id}</td>
                          <td className="customer-expand__cell">
                            <span className="customer-expand__title">{customer.company}</span>
                          </td>
                          <td>{customer.business_registration_number ?? ''}</td>
                          <td>{items.length}</td>
                          <td>{formatDateTime(customer.created_at)}</td>
                          <td>
                            <button
                              className="icon-button"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                showToast('고객사 페이지에서 수정해 주세요.');
                              }}
                              aria-label="고객사 수정"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  d="M4 20h4l11-11a2.1 2.1 0 0 0-3-3L5 17v3z"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M14 6l4 4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="customer-expand__details" key={`${customer.id}-details`}>
                            <td colSpan={6}>
                                {items.length === 0 ? (
                                  <p className="table__status">담당자가 없습니다.</p>
                                ) : (
                                  <table className="data-table customer-expand__subtable">
                                  <thead>
                                    <tr>
                                      <th>id</th>
                                      <th>담당자</th>
                                      <th>연락처</th>
                                      <th>이메일</th>
                                      <th>등록일시</th>
                                      <th>삭제</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((contact) => (
                                      <tr key={contact.id} className="data-table__row">
                                        <td>{contact.id ?? ''}</td>
                                        <td>{contact.name ?? ''}</td>
                                        <td>{contact.contact ?? ''}</td>
                                        <td>{contact.email ?? ''}</td>
                                        <td>{formatDateTime(contact.created_at)}</td>
                                        <td>
                                          <button
                                            className="icon-button icon-button--danger"
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              showToast('고객사 페이지에서 삭제해 주세요.');
                                            }}
                                            aria-label="담당자 삭제"
                                          >
                                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                              <path
                                                d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </>
  );
}

export default Customers2Page;
