#include "philo.h"

#prototype(s)
static long	ft_atol(char *str);
static long	is_digit(char c);

int	parse_args(int argc, char **argv, t_table *table)
{
	table->count = ft_atol(argv[1]);
	table->time_to_eat = ft_atol(argv[2]);
	table->time_to_die = ft_atol(argv[3]);
	table->time_to_sleep = ft_atol(argv[4]);
	table->must_eat = -1;
	if (argc == 6)
		table->must_eat = ft_atol(argv[5]);
	if (table->count <= 0 || table->time_to_die <= 0
		|| table->time_to_eat <= 0 || table->time_to_sleep <= 0)
		return (0);
	if (argc == 6 && table->must_eat <= 0)
		return (0);
	table->stop = 0;
	return (1);
}

static int	is_digit(char c)
{
	return (c >= '0' && c <= '9');
}

static long	ft_atol(char *str)
{
	long	result;
	int		i;

	result = 0;
	i = 0;
	if (!str || !str[0])
		return (-1);
	while (str[i])
	{
		if (!is_digit(str[i]))
			return (-1);
		result = result * 10 + (str[i] - '0');
		if (result > 2147483647)
			return (-1);
		i++;
	}
	return (result);
}
