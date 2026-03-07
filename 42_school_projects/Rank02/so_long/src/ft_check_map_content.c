/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_check_map_content.c                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:03:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/27 17:22:37 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../header/so_long.h"

// prototype(s)
static void	ft_height_and_width(t_map_data *map_data);
static void	ft_check_walls(t_map_data *map_data);
static void	ft_check_map_content(t_map_data *map_data);
static void	ft_process_map_object(t_map_data *map_data, int c,
				int height, int width);

void	ft_validate_map(t_map_data *map_data)
{
	int	i;

	i = 0;
	while (map_data->map[i])
	{
		if (map_data->map[i][0] == '\0')
			ft_error("Empty line in map\n", map_data);
		i++;
	}
	ft_height_and_width(map_data);
	ft_check_walls(map_data);
	ft_check_map_content(map_data);
}

static void	ft_height_and_width(t_map_data *map_data)
{
	int	i;

	i = 0;
	while (map_data->map[i])
		i++;
	map_data->height = i;
	map_data->width = ft_strlen(map_data->map[0]);
	i = 1;
	while (i < map_data->height)
	{
		if ((int)ft_strlen(map_data->map[i]) != map_data->width)
			ft_error("Inconsistent map width\n", map_data);
		i++;
	}
	if (map_data->height < 3 || map_data->width < 3)
		ft_error("Map is too small\n", map_data);
}

static void	ft_check_walls(t_map_data *map_data)
{
	int	i;
	int	h;
	int	w;

	h = map_data->height - 1;
	w = map_data->width - 1;
	i = 0;
	while (map_data->map[0][i] && map_data->map[h][i])
	{
		if (map_data->map[0][i] != '1' || map_data->map[h][i] != '1')
			ft_error("Map wall is missing\n", map_data);
		i++;
	}
	i = 1;
	while (i < h)
	{
		if (map_data->map[i][0] != '1' || map_data->map[i][w] != '1')
			ft_error("Map wall is missing\n", map_data);
		i++;
	}
}

static void	ft_check_map_content(t_map_data *map_data)
{
	int	i;
	int	j;
	int	h;
	int	w;

	i = 1;
	h = map_data->height - 1;
	w = map_data->width - 1;
	while (i < h)
	{
		j = 1;
		while (j < w)
		{
			if (!ft_is_map_object(map_data->map[i][j]))
				ft_error("Invalid char in map\n", map_data);
			ft_process_map_object(map_data, map_data->map[i][j], i, j);
			j++;
		}
		i++;
	}
	if (map_data->collectibles == 0)
		ft_error("Map must contain >= one collectible\n", map_data);
	if (map_data->exit->exit_count == 0)
		ft_error("Map must contain >= one exit\n", map_data);
}

static void	ft_process_map_object(t_map_data *map_data, int c,
					int height, int width)
{
	if (c == 'E')
	{
		map_data->exit->exit_count++;
		if (map_data->exit->exit_count > 1)
			ft_error("Too many exits\n", map_data);
		map_data->exit->exit_x_position = width;
		map_data->exit->exit_y_position = height;
	}
	if (c == 'P')
	{
		map_data->player->player_count++;
		if (map_data->player->player_count > 1)
			ft_error("Too many players\n", map_data);
		map_data->player->x_position = width;
		map_data->player->y_position = height;
	}
	if (c == 'C')
		map_data->collectibles++;
}
