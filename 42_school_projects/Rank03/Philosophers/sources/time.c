#include "philo.h"

long	now_ms(void)
{
	struct timeval	tv;

	gettimeofday(&tv, NULL);
	return ((tv.tv_sec * 1000) + (tv.tv_usec / 1000));
}

long	elapsed(t_table *table)
{
	return (now_ms() - table->start_time);
}

int	is_stopped(t_table *table)
{
	int	value;

	pthread_mutex_lock(&table->state_lock);
	value = table->stop;
	pthread_mutex_unlock(&table->state_lock);
	return (value);
}

void	set_stop(t_table *table)
{
	pthread_mutex_lock(&table->state_lock);
	table->stop = 1;
	pthread_mutex_unlock(&table->state_lock);
}

void	smart_sleep(t_table *table, long duration)
{
	long	start;

	start = now_ms();
	while (!is_stopped(table))
	{
		if (now_ms() - start >= duration)
			break ;
		usleep(500);
	}
}
