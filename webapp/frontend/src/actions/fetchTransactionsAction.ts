import AppClient from '../httpClients/appClient';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import {
  ErrorRes,
  ItemDetail,
  UserTransactionsReq,
  UserTransactionsRes,
} from '../types/appApiTypes';
import { AppResponseError } from '../errors/AppResponseError';
import { TransactionItem } from '../dataObjects/item';
import { NotFoundError } from '../errors/NotFoundError';
import { TransactionStatus } from '../dataObjects/transaction';
import { ShippingStatus } from '../dataObjects/shipping';
import { FormErrorState } from '../reducers/formErrorReducer';

export const FETCH_TRANSACTIONS_START = 'FETCH_TRANSACTIONS_START';
export const FETCH_TRANSACTIONS_SUCCESS = 'FETCH_TRANSACTIONS_SUCCESS';
export const FETCH_TRANSACTIONS_FAIL = 'FETCH_TRANSACTIONS_FAIL';

type Actions =
  | FetchTransactionsStartAction
  | FetchTransactionsSuccessAction
  | FetchTransactionsFailAction;
type ThunkResult<R> = ThunkAction<R, void, undefined, Actions>;

export function fetchTransactionsAction(
  itemId?: number,
  createdAt?: number,
): ThunkResult<void> {
  return (dispatch: ThunkDispatch<any, any, Actions>) => {
    Promise.resolve()
      .then(() => {
        dispatch(fetchTransactionsStartAction());
      })
      .then(() => {
        return AppClient.get('/users/transactions.json', {
          item_id: itemId,
          created_at: createdAt,
        } as UserTransactionsReq);
      })
      .then(async (response: Response) => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new NotFoundError('Transactions not found');
          }

          const errRes: ErrorRes = await response.json();
          throw new AppResponseError(errRes.error, response);
        }

        return await response.json();
      })
      .then((body: UserTransactionsRes) => {
        dispatch(
          fetchTransactionsSuccessAction({
            items: body.items.map((item: ItemDetail) => ({
              id: item.id,
              status: item.status,
              transactionEvidenceStatus: item.transaction_evidence_status as TransactionStatus, // MEMO API will return this value for this endpoint
              shippingStatus: item.shipping_status as ShippingStatus, // MEMO API will return this value for this endpoint
              name: item.name,
              thumbnailUrl: item.image_url,
              createdAt: item.created_at,
            })),
            hasNext: body.has_next,
          }),
        );
      })
      .catch((err: Error) => {
        dispatch(
          fetchTransactionsFailAction({
            error: err.message,
          }),
        );
      });
  };
}

export interface FetchTransactionsStartAction
  extends Action<typeof FETCH_TRANSACTIONS_START> {}

const fetchTransactionsStartAction = (): FetchTransactionsStartAction => {
  return {
    type: FETCH_TRANSACTIONS_START,
  };
};

export interface FetchTransactionsSuccessAction
  extends Action<typeof FETCH_TRANSACTIONS_SUCCESS> {
  payload: {
    items: TransactionItem[];
    hasNext: boolean;
  };
}

const fetchTransactionsSuccessAction = (payload: {
  items: TransactionItem[];
  hasNext: boolean;
}): FetchTransactionsSuccessAction => {
  return {
    type: FETCH_TRANSACTIONS_SUCCESS,
    payload,
  };
};

export interface FetchTransactionsFailAction
  extends Action<typeof FETCH_TRANSACTIONS_FAIL> {
  payload: FormErrorState;
}

const fetchTransactionsFailAction = (
  newErrors: FormErrorState,
): FetchTransactionsFailAction => {
  return {
    type: FETCH_TRANSACTIONS_FAIL,
    payload: newErrors,
  };
};