/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_error_and_exit_cases.c                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/24 18:21:49 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 14:05:26 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../header/so_long.h"

void	ft_error(char *str, t_map_data *map_data)
{
	ft_printf("Error\n%s", str);
	ft_close_fd(map_data->map_fd);
	ft_free_map(map_data->map);
	ft_free_map(map_data->map_flood);
	exit (1);
}

void	ft_clean_map_and_fd(t_mlx *mlx)
{
	ft_close_fd(mlx->game_map->map_fd);
	ft_free_map(mlx->game_map->map);
	ft_free_map(mlx->game_map->map_flood);
}

void	ft_free_map(char **str)
{
	int	i;

	i = 0;
	if (!str)
		return ;
	while (str[i])
	{
		free(str[i]);
		i++;
	}
	free(str);
}

void	ft_close_fd(int fd)
{
	if (fd != -1)
		close(fd);
}
