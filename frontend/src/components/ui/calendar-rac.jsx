import { cn } from '../../lib/utils';
import { getLocalTimeZone, today } from '@internationalized/date';
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  composeRenderProps,
} from 'react-aria-components';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

const CalendarHeader = () => (
  <header className="flex w-full items-center gap-1 pb-1">
    <Button
      slot="previous"
      className="flex size-9 items-center justify-center rounded-lg text-gray-400 outline-offset-2 transition-colors hover:bg-rose-50 hover:text-gray-800 focus:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-rose-300"
    >
      <ChevronLeftIcon className="w-4 h-4" />
    </Button>
    <HeadingRac className="grow text-center text-sm font-medium text-gray-800" />
    <Button
      slot="next"
      className="flex size-9 items-center justify-center rounded-lg text-gray-400 outline-offset-2 transition-colors hover:bg-rose-50 hover:text-gray-800 focus:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-rose-300"
    >
      <ChevronRightIcon className="w-4 h-4" />
    </Button>
  </header>
);

const CalendarGridComponent = () => {
  const now = today(getLocalTimeZone());
  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="size-9 rounded-lg p-0 text-xs font-medium text-gray-400">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:px-0">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              'relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg border border-transparent p-0 text-sm font-normal text-gray-800 outline-offset-2 duration-150 [transition-property:color,background-color,border-radius,box-shadow] focus:outline-none data-[disabled]:pointer-events-none data-[unavailable]:pointer-events-none data-[focus-visible]:z-10 data-[hovered]:bg-rose-50 data-[selected]:bg-rose-500 data-[hovered]:text-gray-800 data-[selected]:text-white data-[unavailable]:line-through data-[disabled]:opacity-30 data-[unavailable]:opacity-30 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-rose-300',
              date.compare(now) === 0 &&
                'after:pointer-events-none after:absolute after:bottom-1 after:start-1/2 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-rose-500 data-[selected]:after:bg-white',
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  );
};

export function Calendar({ className, ...props }) {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (cls) => cn('w-fit', cls))}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  );
}

export function RangeCalendar({ className, ...props }) {
  return (
    <RangeCalendarRac
      {...props}
      className={composeRenderProps(className, (cls) => cn('w-fit', cls))}
    >
      <CalendarHeader />
      <CalendarGridComponent isRange />
    </RangeCalendarRac>
  );
}
